/**
 * Show the Slop Breaker no-op toast.
 * @returns {void}
 */
export function showSlopBreakerNoop() {
    toastr.info('还没有可清理的内容，请先等待一条 AI 回复。', 'Summaryception');
}

/**
 * Show the appropriate toast after a catch-up run finishes.
 * @param {import('../core/summarizer-manual.js').ManualRunOutcome} outcome
 * @returns {void}
 */
export function showCatchupOutcome(outcome) {
    if (outcome.blocked && outcome.totalBatches === 0) {
        toastr.warning('前台生成正在进行中。请等回复完成后重试强制摘要。', 'Summaryception', {
            timeOut: 5000,
        });
    } else if (outcome.cancelled) {
        toastr.warning(
            `追补在 ${outcome.completed}/${outcome.totalBatches} 处暂停。进度已保存 - 将在下一条消息时继续。`,
            'Summaryception',
            { timeOut: 5000 },
        );
    } else if (outcome.blocked) {
        toastr.warning(
            `追补在 ${outcome.completed}/${outcome.totalBatches} 处暂停。请在生成结束后重试。`,
            'Summaryception',
            { timeOut: 5000 },
        );
    } else if (outcome.failureLimitReached) {
        toastr.error(
            '连续 3 次失败 - API 可能不可用。暂停追补。进度已保存；将在下一条消息时恢复。',
            'Summaryception',
            { timeOut: 8000 },
        );
    } else if (outcome.totalBatches > 0 && outcome.failed === 0) {
        toastr.success(`追补完成！已处理 ${outcome.completed} 个批次。`, 'Summaryception', {
            timeOut: 4000,
        });
    } else if (outcome.failed > 0) {
        toastr.warning(
            `追补结束。${outcome.completed} 成功，${outcome.failed} 失败（将在下次触发时重试）。`,
            'Summaryception',
            { timeOut: 6000 },
        );
    }
}

/**
 * Show the Slop Breaker completion, abort, or failure toast.
 * @param {import('../core/summarizer-manual.js').ManualRunOutcome} outcome
 * @returns {void}
 */
export function showSlopBreakerOutcome(outcome) {
    if (outcome.fullyCommitted) {
        toastr.success('失控清理完成。正在重新加载聊天上下文。', 'Summaryception', {
            timeOut: 3000,
        });
    } else if (outcome.blocked && outcome.totalBatches === 0) {
        toastr.warning('前台生成正在进行中。请等回复完成后重试失控清理。', 'Summaryception', {
            timeOut: 5000,
        });
    } else if (outcome.totalBatches === 0) {
        showSlopBreakerNoop();
    } else if (outcome.cancelled && outcome.completed === 0) {
        toastr.warning('失控清理已停止。没有完成新的切割。', 'Summaryception', {
            timeOut: 5000,
        });
    } else if (outcome.cancelled || outcome.blocked) {
        toastr.warning('失控清理已停止。部分进度已保存，但目标切割未完成。', 'Summaryception', {
            timeOut: 6000,
        });
    } else if (outcome.completed === 0) {
        toastr.error('失控清理失败。没有完成新的切割。', 'Summaryception', {
            timeOut: 6000,
        });
    } else {
        toastr.warning(
            `失控清理在 ${outcome.completed} 个批次后暂停。` +
                `${outcome.failed} 个失败；目标切割未完成。`,
            'Summaryception',
            { timeOut: 6000 },
        );
    }
}

/**
 * Create a persistent manual run progress toast.
 * @param {import('../core/summarizer-manual.js').ManualRunProgress & { onCancel: () => void }} progress
 * @returns {unknown}
 */
export function createManualProgressToast(progress) {
    return toastr.info(getProgressText(progress), progress.title, {
        timeOut: 0,
        extendedTimeOut: 0,
        tapToDismiss: false,
        closeButton: true,
        onCloseClick: progress.onCancel,
    });
}

/**
 * Update an existing manual run progress toast.
 * @param {unknown} progressToast
 * @param {import('../core/summarizer-manual.js').ManualRunProgress} progress
 * @returns {void}
 */
export function updateManualProgressToast(progressToast, progress) {
    $(progressToast)
        .find('.toast-message')
        .text(`${getProgressText(progress)}\n点击 x 暂停`);
}

/**
 * Clear a manual run progress toast if it exists.
 * @param {unknown} progressToast
 * @returns {void}
 */
export function clearManualProgressToast(progressToast) {
    if (progressToast) {
        toastr.clear(progressToast);
    }
}

/**
 * Show the Slop Breaker confirmation modal.
 * @returns {Promise<boolean>}
 */
export function confirmSlopBreaker() {
    return new Promise((resolve) => {
        const $overlay = $('<div class="sc-catchup-overlay">')
            .html(
                `
        <div class="sc-catchup-modal">
        <h3>运行失控清理（Slop Breaker）？</h3>
        <div class="sc-catchup-dialog">
        <p>这会摘要当前实时的对话上下文，包括通常逐字保留的消息。当 AI 卡在重复语句、格式或纠正时使用。如果最新一条是 AI 回复，它会被提交进记忆，之后可能无法安全地滑动或重新生成。</p>
        <hr>
        <div class="sc-catchup-options">
        <button id="sc_slop_breaker_confirm" class="menu_button">
        <i class="fa-solid fa-broom"></i>
        <div class="sc-btn-text">
        <span class="sc-btn-label">开始清理</span>
        </div>
        </button>
        <button id="sc_slop_breaker_cancel" class="menu_button">
        <i class="fa-solid fa-xmark"></i>
        <div class="sc-btn-text">
        <span class="sc-btn-label">取消</span>
        </div>
        </button>
        </div>
        </div>
        </div>
        `,
            )
            .appendTo('body');

        $overlay.find('#sc_slop_breaker_confirm').on('click', () => {
            $overlay.remove();
            resolve(true);
        });
        $overlay.find('#sc_slop_breaker_cancel').on('click', () => {
            $overlay.remove();
            resolve(false);
        });
    });
}

/**
 * Build manual run progress text.
 * @param {import('../core/summarizer-manual.js').ManualRunProgress} progress
 * @returns {string}
 */
function getProgressText(progress) {
    const pct = Math.round((progress.completed / progress.totalBatches) * 100);
    const failStr = progress.failed > 0 ? ` | ${progress.failed} 个失败` : '';
    return `${progress.label}：${progress.completed} / ${progress.totalBatches} 个批次（${pct}%）${failStr}`;
}
