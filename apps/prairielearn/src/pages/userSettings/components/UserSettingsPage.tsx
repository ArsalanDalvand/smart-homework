import { QueryClient, useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import { type ChangeEvent, type DragEvent, useEffect, useRef, useState } from 'react';

import { getAppError } from '@prairielearn/trpc/client';
import { AppErrorAlert, QueryClientProviderDebug } from '@prairielearn/trpc/react';

import { FriendlyDate } from '../../../components/FriendlyDate.js';
import { uiStrings } from '../../../lib/branding.js';
import type { UserAccessToken } from '../../../lib/client/safe-db-types.js';
import { toPersianDigits } from '../../../lib/jalali.js';
import {
  AVATAR_COLORS,
  AVATAR_PRESETS,
  BANNER_THEMES,
  STATUS_PRESETS,
  type StudentPublicProfile,
  TITLE_PRESETS,
  getInitialsFromName,
  getUserAvatarUrl,
  resolveAvatarIconClass,
  resolveStatusLabel,
} from '../../../lib/student-profile.shared.js';
import { createUserTrpcClient } from '../../../trpc/user/client.js';
import { TRPCProvider, useTRPC } from '../../../trpc/user/context.js';
import type { UserSettingsError } from '../../../trpc/user/user-settings.js';

import { DeleteTokenModal } from './DeleteTokenModal.js';
import { GenerateTokenModal } from './GenerateTokenModal.js';

interface EarnedBadgeSummary {
  id: string;
  title: string;
  tier: string;
  iconClass: string;
  description: string;
}

interface UserSettingsPageProps {
  user: {
    id: string;
    uid: string;
    name: string | null;
    uin: string | null;
    email: string | null;
  };
  institution: {
    long_name: string;
    short_name: string;
  };
  authnProviderName: string;
  ipAddress: string | undefined;
  accessTokens: UserAccessToken[];
  newAccessTokens: string[];
  isExamMode: boolean;
  csrfToken: string;
  trpcCsrfToken: string;
  initialEnableSingleKeyShortcuts: boolean;
  initialPublicProfile: StudentPublicProfile;
  earnedBadges: EarnedBadgeSummary[];
  profileSaved: boolean;
}

export function UserSettingsPage({
  user,
  institution,
  authnProviderName,
  ipAddress,
  accessTokens,
  newAccessTokens,
  isExamMode,
  csrfToken,
  trpcCsrfToken,
  initialEnableSingleKeyShortcuts,
  initialPublicProfile,
  earnedBadges,
  profileSaved,
}: UserSettingsPageProps) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() => createUserTrpcClient({ csrfToken: trpcCsrfToken }));

  return (
    <QueryClientProviderDebug client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        <div style={{ fontFamily: 'var(--font-persian)' }}>
          <h1 className="mb-4 h2">تنظیمات حساب کاربری</h1>

          <UserProfileCard
            user={user}
            institution={institution}
            authnProviderName={authnProviderName}
            ipAddress={ipAddress}
          />

          <PublicProfileStudioCard
            csrfToken={csrfToken}
            earnedBadges={earnedBadges}
            initialProfile={initialPublicProfile}
            isExamMode={isExamMode}
            profileSaved={profileSaved}
            userId={user.id}
            userName={user.name || user.uid.split('@')[0]}
          />

          <UserSettingsCard initialEnableSingleKeyShortcuts={initialEnableSingleKeyShortcuts} />

          <PersonalAccessTokensCard
            accessTokens={accessTokens}
            newAccessTokens={newAccessTokens}
            isExamMode={isExamMode}
            csrfToken={csrfToken}
          />

          <BrowserConfigurationCard />
        </div>
      </TRPCProvider>
    </QueryClientProviderDebug>
  );
}

UserSettingsPage.displayName = 'UserSettingsPage';

const CROP_STAGE_SIZE = 280;
const CROP_DIAMETER = 240;
const CROP_OUTPUT_SIZE = 256;

function computeCropGeometry(
  imgWidth: number,
  imgHeight: number,
  rotationDeg: number,
  zoom: number,
) {
  const normalizedRot = ((rotationDeg % 360) + 360) % 360;
  const isQuarterTurn = normalizedRot === 90 || normalizedRot === 270;
  const effW = isQuarterTurn ? imgHeight : imgWidth;
  const effH = isQuarterTurn ? imgWidth : imgHeight;
  const baseScale = Math.max(CROP_DIAMETER / effW, CROP_DIAMETER / effH);
  const drawScale = baseScale * zoom;
  const drawW = effW * drawScale;
  const drawH = effH * drawScale;
  const maxPanX = Math.max(0, (drawW - CROP_DIAMETER) / 2);
  const maxPanY = Math.max(0, (drawH - CROP_DIAMETER) / 2);
  return { drawScale, maxPanX, maxPanY };
}

function clampCropPan(
  panX: number,
  panY: number,
  imgWidth: number,
  imgHeight: number,
  rotationDeg: number,
  zoom: number,
) {
  const { maxPanX, maxPanY } = computeCropGeometry(imgWidth, imgHeight, rotationDeg, zoom);
  return {
    x: Math.max(-maxPanX, Math.min(maxPanX, panX)),
    y: Math.max(-maxPanY, Math.min(maxPanY, panY)),
  };
}

function drawCroppedFrame({
  ctx,
  canvasSize,
  img,
  panX,
  panY,
  zoom,
  rotationDeg,
  scaleFactor,
  withMask,
  showGrid,
}: {
  ctx: CanvasRenderingContext2D;
  canvasSize: number;
  img: HTMLImageElement;
  panX: number;
  panY: number;
  zoom: number;
  rotationDeg: number;
  scaleFactor: number;
  withMask: boolean;
  showGrid: boolean;
}) {
  const natW = img.naturalWidth || img.width;
  const natH = img.naturalHeight || img.height;
  const { drawScale } = computeCropGeometry(natW, natH, rotationDeg, zoom);
  const totalScale = drawScale * scaleFactor;
  const half = canvasSize / 2;

  ctx.clearRect(0, 0, canvasSize, canvasSize);
  if (!withMask) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvasSize, canvasSize);
  }

  ctx.save();
  ctx.translate(half + panX * scaleFactor, half + panY * scaleFactor);
  ctx.rotate((rotationDeg * Math.PI) / 180);
  ctx.drawImage(
    img,
    (-natW * totalScale) / 2,
    (-natH * totalScale) / 2,
    natW * totalScale,
    natH * totalScale,
  );
  ctx.restore();

  if (withMask) {
    const radius = CROP_DIAMETER / 2;
    ctx.save();
    ctx.fillStyle = 'rgba(9, 13, 22, 0.58)';
    ctx.beginPath();
    ctx.rect(0, 0, canvasSize, canvasSize);
    ctx.arc(half, half, radius, 0, Math.PI * 2, true);
    ctx.fill('evenodd');

    if (showGrid) {
      ctx.beginPath();
      ctx.arc(half, half, radius, 0, Math.PI * 2);
      ctx.clip();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.lineWidth = 1;
      for (const offset of [-radius / 3, radius / 3]) {
        ctx.beginPath();
        ctx.moveTo(half + offset, half - radius);
        ctx.lineTo(half + offset, half + radius);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(half - radius, half + offset);
        ctx.lineTo(half + radius, half + offset);
        ctx.stroke();
      }
      ctx.restore();
      ctx.save();
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(half, half, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function AvatarCropModal({
  imageSrc,
  isSaving,
  errorMessage,
  onClose,
  onSave,
}: {
  imageSrc: string;
  isSaving: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
}) {
  const stageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);
  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    panX: number;
    panY: number;
  } | null>(null);

  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotationDeg, setRotationDeg] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Load selected image dimensions into memory cleanly and reset crop transform
  useEffect(() => {
    let active = true;
    const img = new Image();
    img.onload = () => {
      if (!active) return;
      loadedImageRef.current = img;
      setImgSize({ w: img.naturalWidth || img.width, h: img.naturalHeight || img.height });
      setZoom(1);
      setRotationDeg(0);
      setPan({ x: 0, y: 0 });
    };
    img.src = imageSrc;
    return () => {
      active = false;
      loadedImageRef.current = null;
    };
  }, [imageSrc]);

  // Redraw interactive 280x280 circular crop preview canvas whenever transform updates
  useEffect(() => {
    const canvas = stageCanvasRef.current;
    const img = loadedImageRef.current;
    if (!canvas || !img || !imgSize) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawCroppedFrame({
      ctx,
      canvasSize: CROP_STAGE_SIZE,
      img,
      panX: pan.x,
      panY: pan.y,
      zoom,
      rotationDeg,
      scaleFactor: 1,
      withMask: true,
      showGrid: isDragging,
    });
  }, [imgSize, isDragging, pan.x, pan.y, rotationDeg, zoom]);

  // Allow closing the avatar cropper with Escape when no upload is in flight
  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape' && !isSaving) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isSaving, onClose]);

  const applyTransform = (nextZoom: number, nextRot: number, rawPanX: number, rawPanY: number) => {
    const clampedZoom = Math.max(1, Math.min(3, Math.round(nextZoom * 100) / 100));
    setZoom(clampedZoom);
    setRotationDeg(nextRot);
    if (imgSize) {
      setPan(clampCropPan(rawPanX, rawPanY, imgSize.w, imgSize.h, nextRot, clampedZoom));
    }
  };

  const handleConfirm = () => {
    const img = loadedImageRef.current;
    if (!img || !imgSize) return;
    const outCanvas = document.createElement('canvas');
    outCanvas.width = CROP_OUTPUT_SIZE;
    outCanvas.height = CROP_OUTPUT_SIZE;
    const ctx = outCanvas.getContext('2d');
    if (!ctx) return;

    drawCroppedFrame({
      ctx,
      canvasSize: CROP_OUTPUT_SIZE,
      img,
      panX: pan.x,
      panY: pan.y,
      zoom,
      rotationDeg,
      scaleFactor: CROP_OUTPUT_SIZE / CROP_DIAMETER,
      withMask: false,
      showGrid: false,
    });

    let dataUrl = outCanvas.toDataURL('image/webp', 0.86);
    if (!dataUrl.startsWith('data:image/webp') || dataUrl.length > 320_000) {
      dataUrl = outCanvas.toDataURL('image/jpeg', 0.86);
    }
    if (dataUrl.length > 320_000) {
      dataUrl = outCanvas.toDataURL('image/jpeg', 0.72);
    }
    onSave(dataUrl);
  };

  return (
    <div
      aria-labelledby="sh-avatar-crop-title"
      aria-modal="true"
      className="modal fade show d-block sh-crop-backdrop"
      role="dialog"
      tabIndex={-1}
    >
      <button
        aria-label="بستن پنجره برش عکس"
        className="border-0 bg-transparent p-0 position-fixed top-0 start-0 w-100 h-100"
        disabled={isSaving}
        style={{ zIndex: 0 }}
        tabIndex={-1}
        type="button"
        onClick={onClose}
      />
      <div className="modal-dialog modal-dialog-centered position-relative" style={{ zIndex: 1 }}>
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          <div className="modal-header border-bottom">
            <h3 className="modal-title h6 fw-bold mb-0" id="sh-avatar-crop-title">
              <i className="bi bi-crop me-2 text-primary" aria-hidden="true" />
              برش و تنظیم عکس پروفایل
            </h3>
            <button
              aria-label="بستن"
              className="btn-close ms-0 me-auto"
              disabled={isSaving}
              type="button"
              onClick={onClose}
            />
          </div>

          <div className="modal-body text-center">
            {errorMessage && (
              <div className="alert alert-danger py-2 px-3 small text-start mb-3" role="alert">
                {errorMessage}
              </div>
            )}

            <p className="small text-body-secondary mb-3">
              تصویر را بکشید تا در مرکز دایره قرار بگیرد؛ می‌توانید بزرگ‌نمایی و چرخش را تنظیم کنید.
            </p>

            <div className="d-flex justify-content-center mb-3">
              <div className={clsx('sh-crop-stage', { 'is-dragging': isDragging })}>
                <canvas
                  ref={stageCanvasRef}
                  height={CROP_STAGE_SIZE}
                  width={CROP_STAGE_SIZE}
                  onPointerCancel={() => {
                    dragStartRef.current = null;
                    setIsDragging(false);
                  }}
                  onPointerDown={(e) => {
                    if (!imgSize) return;
                    e.currentTarget.setPointerCapture(e.pointerId);
                    dragStartRef.current = {
                      clientX: e.clientX,
                      clientY: e.clientY,
                      panX: pan.x,
                      panY: pan.y,
                    };
                    setIsDragging(true);
                  }}
                  onPointerMove={(e) => {
                    const start = dragStartRef.current;
                    if (!start || !imgSize) return;
                    const dx = e.clientX - start.clientX;
                    const dy = e.clientY - start.clientY;
                    setPan(
                      clampCropPan(
                        start.panX + dx,
                        start.panY + dy,
                        imgSize.w,
                        imgSize.h,
                        rotationDeg,
                        zoom,
                      ),
                    );
                  }}
                  onPointerUp={(e) => {
                    if (dragStartRef.current) {
                      e.currentTarget.releasePointerCapture(e.pointerId);
                      dragStartRef.current = null;
                      setIsDragging(false);
                    }
                  }}
                  onWheel={(e) => {
                    e.preventDefault();
                    const step = e.deltaY < 0 ? 0.1 : -0.1;
                    applyTransform(zoom + step, rotationDeg, pan.x, pan.y);
                  }}
                />
              </div>
            </div>

            <div className="mx-auto mb-3" style={{ maxWidth: '300px' }}>
              <label
                className="form-label small text-body-secondary d-flex justify-content-between mb-1"
                htmlFor="sh-crop-zoom-range"
              >
                <span>بزرگ‌نمایی</span>
                <span className="sh-tabular" dir="ltr">
                  {toPersianDigits(Math.round(zoom * 100))}٪
                </span>
              </label>
              <div className="d-flex align-items-center gap-2">
                <button
                  aria-label="کوچک‌نمایی"
                  className="btn btn-sm btn-outline-secondary"
                  type="button"
                  onClick={() => applyTransform(zoom - 0.15, rotationDeg, pan.x, pan.y)}
                >
                  <i className="bi bi-dash" aria-hidden="true" />
                </button>
                <input
                  className="form-range flex-grow-1"
                  id="sh-crop-zoom-range"
                  max={3}
                  min={1}
                  step={0.05}
                  type="range"
                  value={zoom}
                  onChange={(e) =>
                    applyTransform(Number(e.currentTarget.value), rotationDeg, pan.x, pan.y)
                  }
                />
                <button
                  aria-label="بزرگ‌نمایی"
                  className="btn btn-sm btn-outline-secondary"
                  type="button"
                  onClick={() => applyTransform(zoom + 0.15, rotationDeg, pan.x, pan.y)}
                >
                  <i className="bi bi-plus" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="d-flex justify-content-center gap-2">
              <button
                className="btn btn-sm btn-outline-secondary"
                type="button"
                onClick={() => applyTransform(zoom, (rotationDeg + 90) % 360, pan.x, pan.y)}
              >
                <i className="bi bi-arrow-clockwise me-1" aria-hidden="true" />
                چرخش ۹۰°
              </button>
              <button
                className="btn btn-sm btn-outline-secondary"
                type="button"
                onClick={() => applyTransform(1, 0, 0, 0)}
              >
                <i className="bi bi-arrow-counterclockwise me-1" aria-hidden="true" />
                بازنشانی
              </button>
            </div>
          </div>

          <div className="modal-footer bg-body-tertiary border-top">
            <button
              className="btn btn-secondary btn-sm"
              disabled={isSaving}
              type="button"
              onClick={onClose}
            >
              انصراف
            </button>
            <button
              className="btn btn-primary btn-sm px-3"
              disabled={isSaving || !imgSize}
              type="button"
              onClick={handleConfirm}
            >
              {isSaving ? (
                <span>در حال ذخیره...</span>
              ) : (
                <>
                  <i className="bi bi-check-lg me-1" aria-hidden="true" />
                  ذخیره عکس پروفایل
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PublicProfileStudioCard({
  userId,
  userName,
  initialProfile,
  earnedBadges,
  isExamMode,
  csrfToken,
  profileSaved,
}: {
  userId: string;
  userName: string;
  initialProfile: StudentPublicProfile;
  earnedBadges: EarnedBadgeSummary[];
  isExamMode: boolean;
  csrfToken: string;
  profileSaved: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarPreset, setAvatarPreset] = useState(initialProfile.avatarPreset);
  const [avatarColor, setAvatarColor] = useState(initialProfile.avatarColor);
  const [avatarVersion, setAvatarVersion] = useState<string | null>(initialProfile.avatarVersion);
  const [bannerTheme, setBannerTheme] = useState(initialProfile.bannerTheme);
  const [bio, setBio] = useState(initialProfile.bio ?? '');
  const [statusEmoji, setStatusEmoji] = useState(initialProfile.statusEmoji);
  const [favoriteTopic, setFavoriteTopic] = useState(initialProfile.favoriteTopic ?? '');
  const [githubUsername, setGithubUsername] = useState(initialProfile.githubUsername ?? '');
  const [featuredTitle, setFeaturedTitle] = useState(initialProfile.featuredTitle);
  const [pinnedBadgeIds, setPinnedBadgeIds] = useState<string[]>(initialProfile.pinnedBadgeIds);

  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isAvatarBusy, setIsAvatarBusy] = useState(false);
  const [avatarNotice, setAvatarNotice] = useState<{
    kind: 'success' | 'danger';
    message: string;
  } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const previewName = userName || 'دانشجو';
  const avatarIcon = resolveAvatarIconClass(avatarPreset);
  const avatarUrl = getUserAvatarUrl(userId, avatarVersion);
  const previewStatus = resolveStatusLabel(statusEmoji);
  const previewTitle = featuredTitle === 'auto' ? 'Algorithm Crafter' : featuredTitle;
  const pinnedBadgeSet = new Set(pinnedBadgeIds);

  // Release temporary ObjectURL whenever the user selects another photo or closes the cropper
  useEffect(() => {
    return () => {
      if (cropImageSrc?.startsWith('blob:')) {
        URL.revokeObjectURL(cropImageSrc);
      }
    };
  }, [cropImageSrc]);

  const syncNavbarAvatarDOM = (nextAvatarUrl: string | null) => {
    document.querySelectorAll<HTMLElement>('[data-sh-my-avatar]').forEach((el) => {
      if (nextAvatarUrl) {
        const imgEl = document.createElement('img');
        imgEl.src = nextAvatarUrl;
        imgEl.alt = '';
        imgEl.className = 'sh-avatar-img';
        el.replaceChildren(imgEl);
      } else {
        const iconCls = el.dataset.iconClass || resolveAvatarIconClass(avatarPreset);
        if (iconCls) {
          const iEl = document.createElement('i');
          iEl.className = iconCls;
          iEl.setAttribute('aria-hidden', 'true');
          el.replaceChildren(iEl);
        } else {
          const sp = document.createElement('span');
          sp.textContent = el.dataset.initials || getInitialsFromName(previewName);
          el.replaceChildren(sp);
        }
      }
    });
  };

  const openSelectedImageFile = (file: File | undefined | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAvatarNotice({
        kind: 'danger',
        message: 'لطفاً یک فایل تصویر معتبر (PNG، JPG یا WebP) انتخاب کنید.',
      });
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setAvatarNotice({
        kind: 'danger',
        message: 'حجم فایل انتخاب‌شده نباید بیشتر از ۱۵ مگابایت باشد.',
      });
      return;
    }
    setAvatarNotice(null);
    const objUrl = URL.createObjectURL(file);
    setCropImageSrc(objUrl);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    openSelectedImageFile(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    openSelectedImageFile(e.dataTransfer.files[0]);
  };

  const handleSaveCroppedAvatar = async (dataUrl: string) => {
    setIsAvatarBusy(true);
    setAvatarNotice(null);
    try {
      const resp = await fetch(window.location.pathname, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          __action: 'upload_avatar',
          image_data_url: dataUrl,
        }),
      });
      const payload = (await resp.json()) as {
        ok?: boolean;
        avatarVersion?: string;
        avatarUrl?: string;
        error?: string;
      };
      if (!resp.ok || !payload.ok || !payload.avatarVersion) {
        throw new Error(payload.error || 'خطا در ذخیره‌سازی عکس پروفایل.');
      }
      setAvatarVersion(payload.avatarVersion);
      syncNavbarAvatarDOM(payload.avatarUrl ?? getUserAvatarUrl(userId, payload.avatarVersion));
      setCropImageSrc(null);
      setAvatarNotice({
        kind: 'success',
        message: 'عکس پروفایل شما ذخیره شد و در جدول امتیازات و نوار بالا نمایش داده می‌شود.',
      });
    } catch (err) {
      setAvatarNotice({
        kind: 'danger',
        message: err instanceof Error ? err.message : 'خطا در ارتباط با سرور برای ذخیره عکس.',
      });
    } finally {
      setIsAvatarBusy(false);
    }
  };

  const handleDeleteAvatar = async () => {
    setIsAvatarBusy(true);
    setAvatarNotice(null);
    try {
      const resp = await fetch(window.location.pathname, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ __action: 'delete_avatar' }),
      });
      const payload = (await resp.json()) as { ok?: boolean; error?: string };
      if (!resp.ok || !payload.ok) {
        throw new Error(payload.error || 'حذف عکس انجام نشد.');
      }
      setAvatarVersion(null);
      syncNavbarAvatarDOM(null);
      setAvatarNotice({
        kind: 'success',
        message: 'عکس پروفایل حذف شد و آواتار جایگزین نمایش داده می‌شود.',
      });
    } catch (err) {
      setAvatarNotice({
        kind: 'danger',
        message: err instanceof Error ? err.message : 'خطا در حذف عکس پروفایل.',
      });
    } finally {
      setIsAvatarBusy(false);
    }
  };

  const togglePinnedBadge = (badgeId: string) => {
    setPinnedBadgeIds((prev) => {
      if (prev.includes(badgeId)) return prev.filter((id) => id !== badgeId);
      if (prev.length >= 3) return [...prev.slice(1), badgeId];
      return [...prev, badgeId];
    });
  };

  const quickTopics = ['الگوریتم', 'توابع بازگشتی', 'ساختار داده', 'کدنویسی تمیز', 'هوش مصنوعی'];

  return (
    <div className="card mb-4" id="public-profile">
      <div className="card-header sh-hero-header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h2 className="h5 mb-0 text-body d-flex align-items-center gap-2">
            <i className="bi bi-person-badge-fill text-primary" aria-hidden="true" />
            <span>پروفایل عمومی و هویت برنامه‌نویسی</span>
          </h2>
          <div className="small text-body-secondary mt-1">
            نام واقعی شما همراه با عکس، نشان‌ها و افتخاراتتان در جدول امتیازات، لیگ هفتگی، First
            Blood و شناسنامه Coding Passport نمایش داده می‌شود.
          </div>
        </div>
        <span className="badge bg-body-tertiary text-body border">قابل شخصی‌سازی</span>
      </div>

      <div className="card-body">
        {profileSaved && (
          <div className="alert alert-success d-flex align-items-center gap-2 mb-4" role="alert">
            <i className="bi bi-check-circle-fill" aria-hidden="true" />
            <span>تنظیمات پروفایل عمومی شما با موفقیت ذخیره شد.</span>
          </div>
        )}

        {avatarNotice && (
          <div
            className={`alert alert-${avatarNotice.kind} d-flex align-items-center gap-2 mb-4`}
            role="alert"
          >
            <i
              className={
                avatarNotice.kind === 'success'
                  ? 'bi bi-check-circle-fill'
                  : 'bi bi-exclamation-circle-fill'
              }
              aria-hidden="true"
            />
            <span>{avatarNotice.message}</span>
          </div>
        )}

        {isExamMode ? (
          <div className="alert alert-secondary mb-0">
            در حالت آزمون، امکان تغییر پروفایل عمومی غیرفعال است.
          </div>
        ) : (
          <>
            {/* Telegram-style Profile Photo Studio */}
            <div
              className={clsx('sh-avatar-dropzone mb-4', { 'is-dragover': isDragOver })}
              onDragLeave={() => setIsDragOver(false)}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                accept="image/*"
                className="d-none"
                type="file"
                onChange={handleFileChange}
              />
              <div className="d-flex flex-wrap align-items-center gap-3">
                <div className="sh-avatar-hero-wrap">
                  <button
                    aria-label="انتخاب یا تغییر عکس پروفایل"
                    className={`sh-avatar sh-avatar-hero sh-av-color-${avatarColor} border-0 p-0`}
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {avatarUrl ? (
                      <img alt="" className="sh-avatar-img" src={avatarUrl} />
                    ) : avatarIcon ? (
                      <i className={avatarIcon} aria-hidden="true" />
                    ) : (
                      <span>{getInitialsFromName(previewName)}</span>
                    )}
                  </button>
                  <button
                    aria-label="تغییر عکس پروفایل"
                    className="sh-avatar-camera-btn"
                    title="انتخاب عکس پروفایل"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <i className="bi bi-camera-fill" aria-hidden="true" />
                  </button>
                </div>

                <div className="min-w-0 flex-grow-1">
                  <div className="fw-bold text-body mb-1">عکس پروفایل</div>
                  <div className="small text-body-secondary mb-3">
                    تصویر دلخواه خود را انتخاب کنید یا بکشید و رها کنید — سپس مثل تلگرام به صورت
                    دایره‌ای برش دهید و تنظیم کنید.
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={isAvatarBusy}
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <i className="bi bi-upload me-1" aria-hidden="true" />
                      {avatarUrl ? 'تغییر عکس پروفایل' : 'انتخاب عکس پروفایل'}
                    </button>
                    {avatarUrl && (
                      <button
                        className="btn btn-outline-danger btn-sm"
                        disabled={isAvatarBusy}
                        type="button"
                        onClick={handleDeleteAvatar}
                      >
                        <i className="bi bi-trash3 me-1" aria-hidden="true" />
                        حذف عکس
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <form method="POST">
              <input name="__csrf_token" type="hidden" value={csrfToken} />
              <input name="__action" type="hidden" value="update_public_profile" />
              <input name="avatar_preset" type="hidden" value={avatarPreset} />
              <input name="avatar_color" type="hidden" value={avatarColor} />
              <input name="avatar_version" type="hidden" value={avatarVersion ?? ''} />
              <input name="banner_theme" type="hidden" value={bannerTheme} />
              <input name="status_emoji" type="hidden" value={statusEmoji} />
              <input name="featured_title" type="hidden" value={featuredTitle} />
              <input name="pinned_badge_ids" type="hidden" value={pinnedBadgeIds.join(',')} />

              {/* Live Interactive Preview */}
              <div className="sh-profile-preview mb-4">
                <div className="small fw-bold text-body-secondary mb-2">
                  پیش‌نمایش زنده (آنچه هم‌کلاسی‌ها می‌بینند)
                </div>

                <div className={`sh-passport-banner sh-banner-${bannerTheme} mb-3`}>
                  <div className="d-flex flex-wrap align-items-center gap-3 position-relative">
                    <div className={`sh-avatar sh-avatar-lg sh-av-color-${avatarColor}`}>
                      {avatarUrl ? (
                        <img alt="" className="sh-avatar-img" src={avatarUrl} />
                      ) : avatarIcon ? (
                        <i className={avatarIcon} aria-hidden="true" />
                      ) : (
                        <span>{getInitialsFromName(previewName)}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-grow-1">
                      <div className="d-flex flex-wrap align-items-center gap-2">
                        <span className="h5 fw-bold text-white mb-0">{previewName}</span>
                        <span className="sh-wrapup-medal-pill sh-en-term">{previewTitle}</span>
                        {previewStatus && <span className="sh-status-chip">{previewStatus}</span>}
                      </div>
                      {bio.trim() && (
                        <div className="small text-white text-opacity-75 mt-1">{bio.trim()}</div>
                      )}
                      <div className="d-flex flex-wrap gap-2 mt-2 small">
                        {favoriteTopic.trim() && (
                          <span className="sh-wrapup-medal-pill">
                            🎯 علاقه: {favoriteTopic.trim()}
                          </span>
                        )}
                        {githubUsername.trim() && (
                          <span className="sh-wrapup-medal-pill sh-en-term" dir="ltr">
                            <i className="bi bi-github me-1" aria-hidden="true" />@
                            {githubUsername.trim().replace(/^@/, '')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Miniature Leaderboard Row Preview */}
                <div className="sh-profile-preview-row p-2 rounded border bg-body d-flex flex-wrap align-items-center justify-content-between gap-2 small">
                  <div className="d-flex flex-wrap align-items-center gap-2">
                    <span className="se-rank-badge is-rank-1">۳</span>
                    <span className={`sh-avatar sh-av-color-${avatarColor}`}>
                      {avatarUrl ? (
                        <img alt="" className="sh-avatar-img" src={avatarUrl} />
                      ) : avatarIcon ? (
                        <i className={avatarIcon} aria-hidden="true" />
                      ) : (
                        <span>{getInitialsFromName(previewName)}</span>
                      )}
                    </span>
                    <span className="fw-semibold text-body">{previewName}</span>
                    <span className="sh-lv-chip sh-en-term">Lv.5</span>
                    {earnedBadges
                      .filter((b) => pinnedBadgeSet.has(b.id))
                      .slice(0, 3)
                      .map((b) => (
                        <span
                          key={b.id}
                          className={`sh-showcase-badge sh-tier-${b.tier}`}
                          title={b.title}
                        >
                          <i className={b.iconClass} aria-hidden="true" />
                        </span>
                      ))}
                  </div>
                  <span className="text-body-secondary">نمای ردیف جدول امتیازات</span>
                </div>
              </div>

              <div className="row g-4">
                {/* Column 1: Textual Identity */}
                <div className="col-lg-6">
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <label className="form-label fw-semibold mb-1" htmlFor="sh-profile-bio">
                        معرفی کوتاه یا شعار کدنویسی (Bio)
                      </label>
                      <small className="text-body-secondary sh-tabular">
                        {toPersianDigits(bio.length)} / ۱۶۰
                      </small>
                    </div>
                    <textarea
                      id="sh-profile-bio"
                      className="form-control"
                      maxLength={160}
                      name="bio"
                      placeholder="مثلاً: عاشق پایتون، حل مسائل الگوریتمی و قهوه تلخ!"
                      rows={2}
                      value={bio}
                      onChange={(e) => setBio(e.currentTarget.value)}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold" htmlFor="sh-profile-topic">
                      مبحث مورد علاقه
                    </label>
                    <input
                      id="sh-profile-topic"
                      className="form-control mb-2"
                      maxLength={48}
                      name="favorite_topic"
                      placeholder="مثلاً: حلقه‌ها و لیست‌ها، بازگشت، الگوریتم..."
                      type="text"
                      value={favoriteTopic}
                      onChange={(e) => setFavoriteTopic(e.currentTarget.value)}
                    />
                    <div className="d-flex flex-wrap gap-1">
                      {quickTopics.map((topic) => (
                        <button
                          key={topic}
                          className="btn btn-xs btn-outline-secondary"
                          type="button"
                          onClick={() => setFavoriteTopic(topic)}
                        >
                          + {topic}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold" htmlFor="sh-profile-github">
                      نام کاربری گیت‌هاب (اختیاری)
                    </label>
                    <div className="input-group" dir="ltr">
                      <span className="input-group-text">github.com/</span>
                      <input
                        id="sh-profile-github"
                        className="form-control"
                        maxLength={39}
                        name="github_username"
                        placeholder="username"
                        type="text"
                        value={githubUsername}
                        onChange={(e) => setGithubUsername(e.currentTarget.value)}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <span className="form-label fw-semibold d-block">حس‌وحال فعلی (Status)</span>
                    <div className="d-flex flex-wrap gap-1">
                      {STATUS_PRESETS.map((st) => (
                        <button
                          key={st.id}
                          aria-pressed={statusEmoji === st.id}
                          className={clsx('sh-goal-pill flex-grow-0', {
                            'is-active': statusEmoji === st.id,
                          })}
                          type="button"
                          onClick={() => setStatusEmoji(st.id)}
                        >
                          {st.emoji ? `${st.emoji} ` : ''}
                          {st.labelFa}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="form-label fw-semibold d-block">لقب شاخص در شناسنامه</span>
                    <div className="d-flex flex-wrap gap-1">
                      {TITLE_PRESETS.map((t) => (
                        <button
                          key={t.id}
                          aria-pressed={featuredTitle === t.id}
                          className={clsx('sh-goal-pill flex-grow-0', {
                            'is-active': featuredTitle === t.id,
                            'sh-en-term': t.id !== 'auto',
                          })}
                          type="button"
                          onClick={() => setFeaturedTitle(t.id)}
                        >
                          {t.labelFa}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Column 2: Fallback Avatar, Banner & Badges */}
                <div className="col-lg-6">
                  <div className="mb-3">
                    <span className="form-label fw-semibold d-block">
                      آیکون و رنگ جایگزین (در صورت نداشتن عکس پروفایل)
                    </span>
                    <div className="sh-avatar-grid mb-2">
                      {AVATAR_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          aria-label={preset.labelFa}
                          aria-pressed={avatarPreset === preset.id}
                          className={clsx('sh-avatar-picker-btn', {
                            'is-active': avatarPreset === preset.id,
                          })}
                          title={preset.labelFa}
                          type="button"
                          onClick={() => setAvatarPreset(preset.id)}
                        >
                          {preset.iconClass ? (
                            <i className={preset.iconClass} aria-hidden="true" />
                          ) : (
                            <span className="small fw-bold">
                              {getInitialsFromName(previewName)}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      {AVATAR_COLORS.map((col) => (
                        <button
                          key={col.id}
                          aria-label={col.labelFa}
                          aria-pressed={avatarColor === col.id}
                          className={clsx('sh-color-swatch', col.cssClass, {
                            'is-active': avatarColor === col.id,
                          })}
                          title={col.labelFa}
                          type="button"
                          onClick={() => setAvatarColor(col.id)}
                        >
                          {avatarColor === col.id && (
                            <i className="bi bi-check-lg text-white" aria-hidden="true" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-3">
                    <span className="form-label fw-semibold d-block">تم هدر Coding Passport</span>
                    <div className="sh-theme-grid">
                      {BANNER_THEMES.map((theme) => (
                        <button
                          key={theme.id}
                          aria-pressed={bannerTheme === theme.id}
                          className={clsx('sh-theme-swatch', theme.cssClass, {
                            'is-active': bannerTheme === theme.id,
                          })}
                          type="button"
                          onClick={() => setBannerTheme(theme.id)}
                        >
                          <span className="small fw-semibold text-white">{theme.labelFa}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="form-label fw-semibold d-block">
                      سنجاق کردن مدال‌های برگزیده (حداکثر ۳ مدال)
                    </span>
                    {earnedBadges.length === 0 ? (
                      <div className="small text-body-secondary p-2 rounded border bg-body-tertiary">
                        پس از کسب اولین دستاورد در تمرین‌ها، می‌توانید تا ۳ مدال دلخواه را برای نمایش
                        کنار اسمتان سنجاق کنید.
                      </div>
                    ) : (
                      <div className="d-flex flex-wrap gap-1">
                        {earnedBadges.map((badge) => {
                          const isPinned = pinnedBadgeSet.has(badge.id);
                          return (
                            <button
                              key={badge.id}
                              aria-pressed={isPinned}
                              className={clsx('sh-goal-pill flex-grow-0 sh-en-term', {
                                'is-active': isPinned,
                              })}
                              title={badge.description}
                              type="button"
                              onClick={() => togglePinnedBadge(badge.id)}
                            >
                              <i className={`${badge.iconClass} me-1`} aria-hidden="true" />
                              {badge.title}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-top d-flex flex-wrap align-items-center justify-content-between gap-2">
                <span className="small text-body-secondary">
                  شماره دانشجویی، ایمیل و نمرات امتحانی هرگز در پروفایل عمومی نمایش داده نمی‌شوند.
                </span>
                <button className="btn btn-primary" type="submit">
                  <i className="bi bi-check2-circle me-1" aria-hidden="true" />
                  ذخیره پروفایل عمومی
                </button>
              </div>
            </form>

            {cropImageSrc && (
              <AvatarCropModal
                errorMessage={avatarNotice?.kind === 'danger' ? avatarNotice.message : null}
                imageSrc={cropImageSrc}
                isSaving={isAvatarBusy}
                onClose={() => {
                  if (!isAvatarBusy) setCropImageSrc(null);
                }}
                onSave={handleSaveCroppedAvatar}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function UserProfileCard({
  user,
  institution,
  authnProviderName,
  ipAddress,
}: {
  user: UserSettingsPageProps['user'];
  institution: UserSettingsPageProps['institution'];
  authnProviderName: string;
  ipAddress: string | undefined;
}) {
  return (
    <div className="card mb-4">
      <div className="card-header bg-primary text-white d-flex align-items-center">
        <h2 className="h5 mb-0">مشخصات و هویت کاربر</h2>
      </div>
      <div className="table-responsive">
        <table className="table table-sm two-column-description" aria-label="اطلاعات کاربری">
          <tbody>
            <tr>
              <th>{uiStrings.common.uid}</th>
              <td dir="ltr" style={{ textAlign: 'right' }}>
                {user.uid}
              </td>
            </tr>
            <tr>
              <th>{uiStrings.common.name}</th>
              <td>{user.name || '—'}</td>
            </tr>
            <tr>
              <th>{uiStrings.userSettings.uin}</th>
              <td>{user.uin || '—'}</td>
            </tr>
            <tr>
              <th>{uiStrings.common.email}</th>
              <td dir="ltr" style={{ textAlign: 'right' }}>
                {user.email || '—'}
              </td>
            </tr>
            <tr>
              <th>{uiStrings.common.institution}</th>
              <td>
                {institution.long_name} ({institution.short_name})
              </td>
            </tr>
            <tr>
              <th>{uiStrings.userSettings.authMethod}</th>
              <td>{authnProviderName}</td>
            </tr>
            <tr>
              <th>{uiStrings.userSettings.ipAddress}</th>
              <td dir="ltr" style={{ textAlign: 'right' }}>
                {ipAddress ?? <em>{uiStrings.common.unknown}</em>}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PersonalAccessTokensCard({
  accessTokens,
  newAccessTokens,
  isExamMode,
  csrfToken,
}: {
  accessTokens: UserAccessToken[];
  newAccessTokens: string[];
  isExamMode: boolean;
  csrfToken: string;
}) {
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [tokenToDelete, setTokenToDelete] = useState<UserAccessToken | null>(null);

  return (
    <>
      <div className="card mb-4">
        <div className="card-header bg-primary text-white d-flex align-items-center">
          <h2 className="h5 mb-0">توکن‌های دسترسی شخصی (API Tokens)</h2>
          {!isExamMode && (
            <button
              type="button"
              className="btn btn-light btn-sm ms-auto"
              data-testid="generate-token-button"
              aria-label="ایجاد توکن دسترسی"
              onClick={() => setShowGenerateModal(true)}
            >
              <i className="fa fa-plus me-1" aria-hidden="true" />
              <span className="d-none d-sm-inline">ایجاد توکن جدید</span>
            </button>
          )}
        </div>
        {newAccessTokens.length > 0 && (
          <div className="card-body">
            <div className="alert alert-primary" role="alert">
              توکن دسترسی جدید با موفقیت ایجاد شد! حتماً اکنون آن را کپی نمایید، زیرا پس از بستن این
              بخش مجدداً نمایش داده نخواهد شد.
            </div>
            {newAccessTokens.map((token) => (
              <div
                key={token}
                className="alert alert-success mb-0 d-flex align-items-center justify-content-between"
                role="alert"
              >
                <span className="new-access-token font-monospace" dir="ltr">
                  {token}
                </span>
                <button
                  type="button"
                  className="ms-2 btn btn-sm btn-outline-success js-copy-button"
                  data-clipboard-text={token}
                  aria-label="کپی توکن"
                >
                  <i className="bi bi-clipboard me-1" /> کپی
                </button>
              </div>
            ))}
          </div>
        )}
        <ul className="list-group list-group-flush">
          <TokenList
            accessTokens={accessTokens}
            isExamMode={isExamMode}
            onDeleteToken={setTokenToDelete}
          />
        </ul>
        <div className="card-footer small text-muted">
          از توکن‌های دسترسی می‌توان جهت فراخوانی API سامانه توسط اسکریپت‌های اساتید یا دستیاران آموزشی
          استفاده نمود. در حفظ و نگهداری آن کوشا باشید.
        </div>
      </div>

      <GenerateTokenModal
        show={showGenerateModal}
        csrfToken={csrfToken}
        onClose={() => setShowGenerateModal(false)}
      />

      <DeleteTokenModal
        token={tokenToDelete}
        csrfToken={csrfToken}
        onClose={() => setTokenToDelete(null)}
      />
    </>
  );
}

function TokenList({
  accessTokens,
  isExamMode,
  onDeleteToken,
}: {
  accessTokens: UserAccessToken[];
  isExamMode: boolean;
  onDeleteToken: (token: UserAccessToken) => void;
}) {
  if (isExamMode) {
    return (
      <li className="list-group-item">
        <span className="text-muted">در حالت آزمون، توکن‌های دسترسی غیرفعال هستند.</span>
      </li>
    );
  }

  if (accessTokens.length === 0) {
    return (
      <li className="list-group-item">
        <span className="text-muted">در حال حاضر توکن دسترسی فعالی ایجاد نکرده‌اید.</span>
      </li>
    );
  }

  return (
    <>
      {accessTokens.map((token) => (
        <li key={token.id} className="list-group-item d-flex align-items-center">
          <div className="d-flex flex-column me-3">
            <strong>{token.name}</strong>
            <span className="text-muted small">
              تاریخ ایجاد: <FriendlyDate date={token.created_at} timezone="Asia/Tehran" />
            </span>
            <span className="text-muted small">
              {token.last_used_at !== null ? (
                <>
                  آخرین استفاده: <FriendlyDate date={token.last_used_at} timezone="Asia/Tehran" />
                </>
              ) : (
                'تاکنون استفاده نشده'
              )}
            </span>
          </div>
          <button
            type="button"
            className="btn btn-outline-danger btn-sm ms-auto"
            onClick={() => onDeleteToken(token)}
          >
            حذف توکن
          </button>
        </li>
      ))}
    </>
  );
}

// Example of broken LaTeX rendering that users might see if MathJax isn't working.
const EXAMPLE_BROKEN_LATEX = String.raw`$ x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a} $`;

function BrowserConfigurationCard() {
  const handleResetMathJax = () => {
    localStorage.removeItem('MathJax-Menu-Settings');
    // oxlint-disable-next-line no-alert -- Matches original behavior for user feedback
    alert('تنظیمات فونت ریاضی MathJax بازنشانی شد.');
  };

  return (
    <div className="card mb-4">
      <div className="card-header bg-primary text-white d-flex">
        <h2 className="h5 mb-0">تنظیمات فرمول‌نویسی و رندر مرورگر</h2>
      </div>
      <div className="card-body">
        <p>
          این بخش به شما امکان می‌دهد تنظیمات رندر فرمول‌های ریاضی و کش محلی مرورگر را در صورت مشاهده
          بهم‌ریختگی بازنشانی نمایید.
        </p>
        <p>
          اگر فرمول‌های ریاضی به‌صورت کد خام مانند{' '}
          <span dir="ltr">
            <strong>{EXAMPLE_BROKEN_LATEX}</strong>
          </span>{' '}
          نمایش داده می‌شوند، کلیک بر روی دکمه زیر مشکل را برطرف می‌کند.
        </p>
        <button type="button" className="btn btn-sm btn-primary" onClick={handleResetMathJax}>
          بازنشانی تنظیمات فرمول‌های ریاضی (MathJax)
        </button>
      </div>
    </div>
  );
}

function UserSettingsCard({
  initialEnableSingleKeyShortcuts,
}: {
  initialEnableSingleKeyShortcuts: boolean;
}) {
  const trpc = useTRPC();
  const [enableSingleKeyShortcuts, setEnableSingleKeyShortcuts] = useState(
    initialEnableSingleKeyShortcuts,
  );
  const [savedEnableSingleKeyShortcuts, setSavedEnableSingleKeyShortcuts] = useState(
    initialEnableSingleKeyShortcuts,
  );
  const updateMutation = useMutation({
    ...trpc.settings.update.mutationOptions(),
    onSuccess: ({ enableSingleKeyShortcuts: savedValue }) => {
      setEnableSingleKeyShortcuts(savedValue);
      setSavedEnableSingleKeyShortcuts(savedValue);
    },
  });
  const appError = getAppError<UserSettingsError['Update']>(updateMutation.error);
  const isDirty = enableSingleKeyShortcuts !== savedEnableSingleKeyShortcuts;

  return (
    <div className="card mb-4">
      <div className="card-header bg-primary text-white d-flex align-items-center">
        <h2 className="h5 mb-0">ترجیحات کاربری و کلیدهای میانبر</h2>
      </div>
      <div className="card-body">
        <div className="form-check form-switch">
          <input
            id="enable-keyboard-shortcuts"
            className="form-check-input"
            type="checkbox"
            // False positive: https://github.com/oxc-project/oxc/issues/24838
            // oxlint-disable-next-line jsx-a11y/role-has-required-aria-props
            role="switch"
            aria-describedby="enable-keyboard-shortcuts-description"
            checked={enableSingleKeyShortcuts}
            disabled={updateMutation.isPending}
            onChange={(event) => {
              updateMutation.reset();
              setEnableSingleKeyShortcuts(event.currentTarget.checked);
            }}
          />
          <label className="form-check-label fw-semibold" htmlFor="enable-keyboard-shortcuts">
            فعال‌سازی کلیدهای میانبر تک‌کلیدی
          </label>
          <div id="enable-keyboard-shortcuts-description" className="form-text mt-1">
            امکان استفاده از میانبرهای کیبورد برای جابجایی سریع میان سوالات و ثبت نمرات تصحیح دستی.
          </div>
        </div>

        <AppErrorAlert
          error={appError}
          className="mt-3 mb-0"
          render={{ UNKNOWN: ({ message }) => message }}
          onDismiss={() => updateMutation.reset()}
        />

        <div className="d-flex align-items-center gap-2 mt-3">
          <button
            type="button"
            className="btn btn-primary"
            disabled={!isDirty || updateMutation.isPending}
            onClick={() => updateMutation.mutate({ enableSingleKeyShortcuts })}
          >
            {updateMutation.isPending && (
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
            )}
            {updateMutation.isPending ? 'در حال ذخیره‌سازی…' : 'ذخیره تنظیمات'}
          </button>
          <span
            className={clsx('small text-success', {
              invisible: !updateMutation.isSuccess || isDirty,
            })}
            aria-hidden={!updateMutation.isSuccess || isDirty}
          >
            <i className="bi bi-check-circle-fill me-1" aria-hidden="true" />
            تنظیمات با موفقیت ذخیره گردید.
          </span>
          <span className="visually-hidden" role="status" aria-live="polite">
            {updateMutation.isSuccess && !isDirty ? 'تنظیمات ذخیره شد' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
