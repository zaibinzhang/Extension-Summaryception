import { getSlashCommand, getSlashCommandParser } from '../foundation/context.js';
import { warn } from '../foundation/logger.js';
import { getChatStore } from '../foundation/state.js';
import { assembleSummaryBlock } from '../features/injection.js';
import { clearSummaryceptionMemory } from '../features/memory.js';

// ─── Slash Commands ──────────────────────────────────────────────────

/**
 *
 */
export function registerSlashCommands() {
    try {
        const SlashCommandParser = getSlashCommandParser();
        const SlashCommand = getSlashCommand();

        if (!SlashCommandParser?.addCommandObject || !SlashCommand) {
            warn('SlashCommandParser not available, skipping command registration.');
            return;
        }

        SlashCommandParser.addCommandObject(
            SlashCommand.fromProps({
                name: 'sc-status',
                callback: () => {
                    const store = getChatStore();
                    const lines = ['**Summaryception 状态**'];
                    lines.push(`已摘要到索引：${store.summarizedUpTo}`);
                    if (store.layers) {
                        for (let i = 0; i < store.layers.length; i++) {
                            const l = store.layers[i];
                            if (l && l.length > 0) {
                                lines.push(`Layer ${i}：${l.length} 个摘要片段`);
                            }
                        }
                    }
                    return lines.join('\n');
                },
                helpString: '显示 Summaryception 层级状态',
            }),
        );

        SlashCommandParser.addCommandObject(
            SlashCommand.fromProps({
                name: 'sc-clear',
                callback: async () => {
                    await clearSummaryceptionMemory({ updateUi: true });
                    return 'Summaryception 记忆已清除，消息已取消隐藏。';
                },
                helpString: '清除该聊天的所有 Summaryception 记忆并取消隐藏消息',
            }),
        );

        SlashCommandParser.addCommandObject(
            SlashCommand.fromProps({
                name: 'sc-preview',
                callback: () => {
                    return assembleSummaryBlock() || '（尚无摘要）';
                },
                helpString: '预览将要注入的摘要块',
            }),
        );
    } catch (e) {
        warn('Could not register slash commands:', e);
    }
}
