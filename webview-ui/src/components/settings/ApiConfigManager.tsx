import { VSCodeButton, VSCodeTextField } from "@vscode/webview-ui-toolkit/react"
import { memo, useEffect, useRef, useState } from "react"
import { ApiConfigMeta } from "../../../../src/shared/ExtensionMessage"

interface ApiConfigManagerProps {
	currentApiConfigName?: string
	listApiConfigMeta?: ApiConfigMeta[]
	onSelectConfig: (configName: string) => void
	onDeleteConfig: (configName: string) => void
	onRenameConfig: (oldName: string, newName: string) => void
	onUpsertConfig: (configName: string) => void
}

const ApiConfigManager = ({
	currentApiConfigName = "",
	listApiConfigMeta = [],
	onSelectConfig,
	onDeleteConfig,
	onRenameConfig,
	onUpsertConfig,
}: ApiConfigManagerProps) => {
	const [editState, setEditState] = useState<"new" | "rename" | null>(null)
	const [inputValue, setInputValue] = useState("")
	const inputRef = useRef<HTMLInputElement>()

	// Focus input when entering edit mode
	useEffect(() => {
		if (editState) {
			setTimeout(() => inputRef.current?.focus(), 0)
		}
	}, [editState])

	// Reset edit state when current profile changes
	useEffect(() => {
		setEditState(null)
		setInputValue("")
	}, [currentApiConfigName])

	const handleAdd = () => {
		const newConfigName = currentApiConfigName + " (copy)"
		onUpsertConfig(newConfigName)
	}

	const handleStartRename = () => {
		setEditState("rename")
		setInputValue(currentApiConfigName || "")
	}

	const handleCancel = () => {
		setEditState(null)
		setInputValue("")
	}

	const handleSave = () => {
		const trimmedValue = inputValue.trim()
		if (!trimmedValue) return

		if (editState === "new") {
			onUpsertConfig(trimmedValue)
		} else if (editState === "rename" && currentApiConfigName) {
			onRenameConfig(currentApiConfigName, trimmedValue)
		}

		setEditState(null)
		setInputValue("")
	}

	const handleDelete = () => {
		if (!currentApiConfigName || !listApiConfigMeta || listApiConfigMeta.length <= 1) return

		// Let the extension handle both deletion and selection
		onDeleteConfig(currentApiConfigName)
	}

	const isOnlyProfile = listApiConfigMeta?.length === 1

	return (
		<div style={{ marginBottom: 5 }}>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					gap: "2px",
				}}>
				<label htmlFor="config-profile">
					<span style={{ fontWeight: "500" }}>配置文件</span>
				</label>

				{editState ? (
					<div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
						<VSCodeTextField
							ref={inputRef as any}
							value={inputValue}
							onInput={(e: any) => setInputValue(e.target.value)}
							placeholder={editState === "new" ? "输入配置文件名称" : "输入新名称"}
							style={{ flexGrow: 1 }}
							onKeyDown={(e: any) => {
								if (e.key === "Enter" && inputValue.trim()) {
									handleSave()
								} else if (e.key === "Escape") {
									handleCancel()
								}
							}}
						/>
						<VSCodeButton
							appearance="icon"
							disabled={!inputValue.trim()}
							onClick={handleSave}
							title="保存"
							style={{
								padding: 0,
								margin: 0,
								height: "28px",
								width: "28px",
								minWidth: "28px",
							}}>
							<span className="codicon codicon-check" />
						</VSCodeButton>
						<VSCodeButton
							appearance="icon"
							onClick={handleCancel}
							title="取消"
							style={{
								padding: 0,
								margin: 0,
								height: "28px",
								width: "28px",
								minWidth: "28px",
							}}>
							<span className="codicon codicon-close" />
						</VSCodeButton>
					</div>
				) : (
					<>
						<div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
							<select
								id="config-profile"
								value={currentApiConfigName}
								onChange={(e) => onSelectConfig(e.target.value)}
								style={{
									flexGrow: 1,
									padding: "4px 8px",
									paddingRight: "24px",
									backgroundColor: "var(--vscode-dropdown-background)",
									color: "var(--vscode-dropdown-foreground)",
									border: "1px solid var(--vscode-dropdown-border)",
									borderRadius: "2px",
									height: "28px",
									cursor: "pointer",
									outline: "none",
								}}>
								{listApiConfigMeta?.map((config) => (
									<option key={config.name} value={config.name}>
										{config.name}
									</option>
								))}
							</select>
							<VSCodeButton
								appearance="icon"
								onClick={handleAdd}
								title="添加配置文件"
								style={{
									padding: 0,
									margin: 0,
									height: "28px",
									width: "28px",
									minWidth: "28px",
								}}>
								<span className="codicon codicon-add" />
							</VSCodeButton>
							{currentApiConfigName && (
								<>
									<VSCodeButton
										appearance="icon"
										onClick={handleStartRename}
										title="重命名配置文件"
										style={{
											padding: 0,
											margin: 0,
											height: "28px",
											width: "28px",
											minWidth: "28px",
										}}>
										<span className="codicon codicon-edit" />
									</VSCodeButton>
									<VSCodeButton
										appearance="icon"
										onClick={handleDelete}
										title={isOnlyProfile ? "无法删除唯一的配置文件" : "删除配置文件"}
										disabled={isOnlyProfile}
										style={{
											padding: 0,
											margin: 0,
											height: "28px",
											width: "28px",
											minWidth: "28px",
										}}>
										<span className="codicon codicon-trash" />
									</VSCodeButton>
								</>
							)}
						</div>
						<p
							style={{
								fontSize: "12px",
								margin: "5px 0 12px",
								color: "var(--vscode-descriptionForeground)",
							}}>
							保存不同的API配置，以便快速切换不同的服务提供商和设置
						</p>
					</>
				)}
			</div>
		</div>
	)
}

export default memo(ApiConfigManager)
