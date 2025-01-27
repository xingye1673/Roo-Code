// Define tool group values
export type ToolGroupValues = readonly string[]

// Map of tool slugs to their display names
export const TOOL_DISPLAY_NAMES = {
	execute_command: "运行命令",
	read_file: "读取文件",
	write_to_file: "写入文件",
	apply_diff: "应用更改",
	search_files: "搜索文件",
	list_files: "列出文件",
	list_code_definition_names: "列出定义",
	browser_action: "使用浏览器",
	use_mcp_tool: "使用mcp工具",
	access_mcp_resource: "访问mcp资源",
	ask_followup_question: "提问",
	attempt_completion: "完成任务",
	switch_mode: "切换模式",
} as const

// Define available tool groups
export const TOOL_GROUPS: Record<string, ToolGroupValues> = {
	read: ["read_file", "search_files", "list_files", "list_code_definition_names"],
	edit: ["write_to_file", "apply_diff"],
	browser: ["browser_action"],
	command: ["execute_command"],
	mcp: ["use_mcp_tool", "access_mcp_resource"],
}

export type ToolGroup = keyof typeof TOOL_GROUPS

// Tools that are always available to all modes
export const ALWAYS_AVAILABLE_TOOLS = ["ask_followup_question", "attempt_completion", "switch_mode"] as const

// Tool name types for type safety
export type ToolName = keyof typeof TOOL_DISPLAY_NAMES

// Tool helper functions
export function getToolName(toolConfig: string | readonly [ToolName, ...any[]]): ToolName {
	return typeof toolConfig === "string" ? (toolConfig as ToolName) : toolConfig[0]
}

export function getToolOptions(toolConfig: string | readonly [ToolName, ...any[]]): any {
	return typeof toolConfig === "string" ? undefined : toolConfig[1]
}

// Display names for groups in UI
export const GROUP_DISPLAY_NAMES: Record<ToolGroup, string> = {
	read: "读取文件",
	edit: "编辑文件",
	browser: "使用浏览器",
	command: "运行命令",
	mcp: "使用MCP",
}
