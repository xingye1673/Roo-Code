import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"
import { useEffect, useState } from "react"
import { useExtensionState } from "../../context/ExtensionStateContext"
import { validateApiConfiguration } from "../../utils/validate"
import { vscode } from "../../utils/vscode"
import ApiOptions from "../settings/ApiOptions"

const WelcomeView = () => {
	const { apiConfiguration } = useExtensionState()

	const [apiErrorMessage, setApiErrorMessage] = useState<string | undefined>(undefined)

	const disableLetsGoButton = apiErrorMessage != null

	const handleSubmit = () => {
		vscode.postMessage({ type: "apiConfiguration", apiConfiguration })
	}

	useEffect(() => {
		setApiErrorMessage(validateApiConfiguration(apiConfiguration))
	}, [apiConfiguration])

	return (
		<div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, padding: "0 20px" }}>
			<h2>你好，我是 Roo！</h2>
			<p>
				由于最新的代理编码功能突破以及对各种工具的访问权限，我可以完成各种任务。我能够创建和编辑文件、
				探索复杂项目、使用浏览器，以及执行终端命令（当然，需要经过您的许可）。我甚至可以使用 MCP
				来创建新工具并扩展自己的能力。
			</p>

			<b>要开始使用，此扩展需要一个 API 提供商。</b>

			<div style={{ marginTop: "10px" }}>
				<ApiOptions />
				<VSCodeButton onClick={handleSubmit} disabled={disableLetsGoButton} style={{ marginTop: "3px" }}>
					让我们开始吧！
				</VSCodeButton>
			</div>
		</div>
	)
}

export default WelcomeView
