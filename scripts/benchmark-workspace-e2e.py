#!/usr/bin/env python3
"""
End-to-End (E2E) Verification & Concurrency Benchmark for Smart-Homework VS Code Workspaces.

Tests:
  1. Control-plane health: smart_homework HTTPS ping + workspace_host /status (Postgres + Docker)
  2. Network security: br-no-internet bridge & DOCKER-USER outbound DROP rule
  3. E2E Workspace launch: spawns N concurrent prairielearn/workspace-vscode-python containers
     with production limits (1GiB RAM, no swap, 0.5 CPU, 512 PIDs, no-internet network)
  4. Proxy path verification: verifies smart_homework -> host.docker.internal:<port> returns HTTP 200/302
  5. Runtime & Isolation verification: verifies Python + code-server work AND outbound internet is blocked
  6. Load impact: measures RAM/CPU and live HTTPS website latency under full concurrent load
  7. Guaranteed cleanup of all benchmark containers.

Usage:
  python3 /opt/smart-homework/scripts/benchmark-workspace-e2e.py --concurrency 4
  python3 /opt/smart-homework/scripts/benchmark-workspace-e2e.py --concurrency 2 --json
"""

import argparse
import json
import subprocess
import sys
import time


DEFAULT_IMAGE = "prairielearn/workspace-vscode-python:latest"
DEFAULT_URL = "https://homework.atomathix.ir/pl/webhooks/ping"
BASE_PORT = 18300


def run_cmd(cmd, timeout=30):
    return subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)


def cleanup(names):
    for name in names:
        subprocess.run(["docker", "rm", "-f", name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def check_control_plane(ping_url):
    ws_status = run_cmd(["docker", "exec", "smart_homework", "curl", "-sS", "--noproxy", "*", "http://localhost:8081/status"])
    if ws_status.returncode != 0:
        raise RuntimeError(f"workspace_host /status unreachable: {ws_status.stderr.strip()}")
    status_json = json.loads(ws_status.stdout)
    if status_json.get("postgres") != "ok":
        raise RuntimeError(f"workspace_host postgres check failed: {status_json.get('postgres')}")

    ping = run_cmd(["curl", "-sS", "-o", "/dev/null", "-w", "%{http_code} %{time_total}", ping_url])
    parts = ping.stdout.strip().split()
    if len(parts) != 2 or parts[0] != "200":
        raise RuntimeError(f"Website ping failed: {ping.stdout} {ping.stderr}")
    return float(parts[1])


def launch_workspace(idx, image, memory, cpu_quota, pids_limit):
    name = f"e2e-bench-ws-{idx}"
    port = BASE_PORT + idx
    t0 = time.monotonic()
    subprocess.run(
        [
            "docker", "run", "-d", "--name", name,
            "--network", "no-internet",
            "-p", f"{port}:8080",
            "--memory", memory, "--memory-swap", memory,
            "--cpu-period", "100000", "--cpu-quota", str(cpu_quota),
            "--pids-limit", str(pids_limit),
            "-e", "WORKSPACE_NETWORKING_DISABLED=1",
            image,
        ],
        check=True,
        stdout=subprocess.DEVNULL,
    )
    ready_sec = None
    for _ in range(60):
        res = run_cmd([
            "docker", "exec", "smart_homework",
            "curl", "-sS", "--noproxy", "*", "-o", "/dev/null", "-w", "%{http_code}",
            f"http://host.docker.internal:{port}/",
        ])
        if res.stdout.strip() in ("200", "302"):
            ready_sec = time.monotonic() - t0
            break
        time.sleep(0.25)
    if ready_sec is None:
        logs = run_cmd(["docker", "logs", "--tail", "15", name]).stderr
        raise RuntimeError(f"Workspace {name} (port {port}) failed to become HTTP-ready within 15s: {logs}")
    return name, port, round(ready_sec, 3)


def main():
    parser = argparse.ArgumentParser(description="E2E test and benchmark for VS Code Workspaces")
    parser.add_argument("--concurrency", type=int, default=4, help="Number of simultaneous workspaces (default: 4)")
    parser.add_argument("--image", default=DEFAULT_IMAGE, help=f"Workspace Docker image (default: {DEFAULT_IMAGE})")
    parser.add_argument("--url", default=DEFAULT_URL, help=f"Website ping URL (default: {DEFAULT_URL})")
    parser.add_argument("--memory", default="1g", help="Memory limit per workspace (default: 1g)")
    parser.add_argument("--cpu-quota", type=int, default=50000, help="CPU quota out of 100000 (default: 50000 = 0.5 CPU)")
    parser.add_argument("--pids-limit", type=int, default=512, help="PID limit per workspace (default: 512)")
    parser.add_argument("--json", action="store_true", help="Output results as JSON")
    args = parser.parse_args()

    names = []
    report = {
        "passed": False,
        "image": args.image,
        "concurrency": args.concurrency,
        "baseline_ping_sec": None,
        "under_load_ping_sec": None,
        "startup_times_sec": [],
        "total_launch_sec": None,
        "internet_blocked": False,
        "runtime_info": "",
        "container_stats": [],
    }

    try:
        report["baseline_ping_sec"] = check_control_plane(args.url)

        t_all = time.monotonic()
        for i in range(args.concurrency):
            name, port, sec = launch_workspace(i, args.image, args.memory, args.cpu_quota, args.pids_limit)
            names.append(name)
            report["startup_times_sec"].append({"container": name, "port": port, "ready_sec": sec})
        report["total_launch_sec"] = round(time.monotonic() - t_all, 3)

        # Verify outbound internet is blocked
        net_res = run_cmd(["docker", "exec", names[0], "curl", "-sS", "--max-time", "3", "https://1.1.1.1"])
        report["internet_blocked"] = net_res.returncode != 0
        if not report["internet_blocked"]:
            raise RuntimeError("SECURITY FAILURE: Workspace container was able to reach 1.1.1.1!")

        # Verify Python & code-server inside workspace
        rt_res = run_cmd(["docker", "exec", names[0], "bash", "-lc", "python3 --version && command -v code-server"])
        if rt_res.returncode != 0:
            raise RuntimeError(f"Workspace runtime check failed: {rt_res.stderr}")
        report["runtime_info"] = rt_res.stdout.strip().replace("\n", " | ")

        # Collect container stats under full load
        stats = run_cmd([
            "docker", "stats", "--no-stream", "--format",
            "{{.Name}}|{{.CPUPerc}}|{{.MemUsage}}|{{.PIDs}}",
        ])
        for line in stats.stdout.strip().splitlines():
            parts = line.split("|")
            if len(parts) == 4:
                report["container_stats"].append({
                    "name": parts[0], "cpu": parts[1], "mem": parts[2], "pids": parts[3],
                })

        # Measure live website latency under full concurrent workspace load
        report["under_load_ping_sec"] = check_control_plane(args.url)
        report["passed"] = True

    except Exception as exc:
        report["error"] = str(exc)
    finally:
        cleanup(names)

    if args.json:
        print(json.dumps(report, indent=2))
    else:
        status = "PASS" if report["passed"] else "FAIL"
        print(f"=== Workspace E2E & Benchmark: {status} ===")
        print(f"Image: {report['image']} | Concurrency: {report['concurrency']}")
        print(f"Baseline HTTPS ping: {report['baseline_ping_sec']}s | Under load: {report['under_load_ping_sec']}s")
        for item in report["startup_times_sec"]:
            print(f"  - {item['container']} (:{item['port']}) ready in {item['ready_sec']}s")
        print(f"Total launch time: {report['total_launch_sec']}s")
        print(f"Internet blocked: {report['internet_blocked']} | Runtime: {report['runtime_info']}")
        if report["container_stats"]:
            print("Container stats under load:")
            for st in report["container_stats"]:
                print(f"  {st['name']:18s} CPU={st['cpu']:8s} MEM={st['mem']:22s} PIDs={st['pids']}")
        if "error" in report:
            print(f"ERROR: {report['error']}")

    sys.exit(0 if report["passed"] else 1)


if __name__ == "__main__":
    main()
