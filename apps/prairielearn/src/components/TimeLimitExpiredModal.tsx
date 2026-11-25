import { html } from '@prairielearn/html';

import { Modal } from './Modal.js';

export function TimeLimitExpiredModal({ showAutomatically }: { showAutomatically: boolean }) {
  return html`
    ${Modal({
      id: 'timeLimitExpiredModal',
      title: 'پایان مهلت زمانی',
      body: html`<p>مهلت زمانی شما به پایان رسید و تکلیف/آزمون شما اکنون تمام شده است.</p>`,
      footer: html`
        <button type="button" class="btn btn-primary" data-bs-dismiss="modal">تایید</button>
      `,
    })}
    ${
      showAutomatically
        ? html`
            <script type="module">
              // This script is type="module" so that it is deferred and runs after the DOM is ready.
              const modalElement = document.getElementById('timeLimitExpiredModal');
              window.bootstrap.Modal.getOrCreateInstance(modalElement).show();
            </script>
          `
        : ''
    }
  `;
}
