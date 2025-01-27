// Support prompts
type PromptParams = Record<string, string | any[]>

const generateDiagnosticText = (diagnostics?: any[]) => {
	if (!diagnostics?.length) return ""
	return `\nCurrent problems detected:\n${diagnostics
		.map((d) => `- [${d.source || "Error"}] ${d.message}${d.code ? ` (${d.code})` : ""}`)
		.join("\n")}`
}

export const createPrompt = (template: string, params: PromptParams): string => {
	let result = template
	for (const [key, value] of Object.entries(params)) {
		if (key === "diagnostics") {
			result = result.replaceAll("${diagnosticText}", generateDiagnosticText(value as any[]))
		} else {
			result = result.replaceAll(`\${${key}}`, value as string)
		}
	}

	// Replace any remaining user_input placeholders with empty string
	result = result.replaceAll("${userInput}", "")

	return result
}

interface SupportPromptConfig {
	label: string
	description: string
	template: string
}

const supportPromptConfigs: Record<string, SupportPromptConfig> = {
	ENHANCE: {
		label: "增强提示",
		description:
			"使用提示增强功能获取针对您输入的定制建议或改进。这确保 Roo 能够理解您的意图并提供最佳响应。可通过聊天中的 ✨ 图标使用。",
		template: `生成此提示的增强版本（仅回复增强后的提示 - 无需对话、解释、开场白、要点、占位符或引号）：

\${userInput}`,
	},
	EXPLAIN: {
		label: "解释代码",
		description:
			"获取代码片段、函数或整个文件的详细解释。适用于理解复杂代码或学习新模式。可在编辑器右键菜单中使用（右键点击选中的代码）。",
		template: `解释以下来自文件路径 @/\${filePath} 的代码：
\${userInput}

\`\`\`
\${selectedText}
\`\`\`

请提供清晰简洁的解释，包括：
1. 代码的目的和功能
2. 关键组件及其交互
3. 使用的重要模式或技术`,
	},
	FIX: {
		label: "修复问题",
		description:
			"获取帮助以识别和解决bug、错误或代码质量问题。提供逐步的问题修复指导。可在编辑器右键菜单中使用（右键点击选中的代码）。",
		template: `修复以下来自文件路径 @/\${filePath} 的代码中的问题：
\${diagnosticText}
\${userInput}

\`\`\`
\${selectedText}
\`\`\`

请：
1. 处理上述所有检测到的问题（如果有）
2. 识别任何其他潜在的错误或问题
3. 提供修正后的代码
4. 解释修复了什么以及原因`,
	},
	IMPROVE: {
		label: "改进代码",
		description:
			"接收代码优化、更佳实践和架构改进建议，同时保持功能不变。可在编辑器右键菜单中使用（右键点击选中的代码）。",
		template: `改进以下来自文件路径 @/\${filePath} 的代码：
\${userInput}

\`\`\`
\${selectedText}
\`\`\`

请就以下方面提出改进建议：
1. 代码可读性和可维护性
2. 性能优化
3. 最佳实践和模式
4. 错误处理和边界情况

提供改进后的代码并解释每项增强的原因。`,
	},
} as const

type SupportPromptType = keyof typeof supportPromptConfigs

export const supportPrompt = {
	default: Object.fromEntries(Object.entries(supportPromptConfigs).map(([key, config]) => [key, config.template])),
	get: (customSupportPrompts: Record<string, any> | undefined, type: SupportPromptType): string => {
		return customSupportPrompts?.[type] ?? supportPromptConfigs[type].template
	},
	create: (type: SupportPromptType, params: PromptParams, customSupportPrompts?: Record<string, any>): string => {
		const template = supportPrompt.get(customSupportPrompts, type)
		return createPrompt(template, params)
	},
} as const

export type { SupportPromptType }

// Expose labels and descriptions for UI
export const supportPromptLabels = Object.fromEntries(
	Object.entries(supportPromptConfigs).map(([key, config]) => [key, config.label]),
) as Record<SupportPromptType, string>

export const supportPromptDescriptions = Object.fromEntries(
	Object.entries(supportPromptConfigs).map(([key, config]) => [key, config.description]),
) as Record<SupportPromptType, string>

export type CustomSupportPrompts = {
	[key: string]: string | undefined
}
