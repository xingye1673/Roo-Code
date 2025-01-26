import { Checkbox, Dropdown, Pane } from "vscrui"
import type { DropdownOption } from "vscrui"
import { VSCodeLink, VSCodeRadio, VSCodeRadioGroup, VSCodeTextField } from "@vscode/webview-ui-toolkit/react"
import { Fragment, memo, useCallback, useEffect, useMemo, useState } from "react"
import { useEvent, useInterval } from "react-use"
import {
	ApiConfiguration,
	ModelInfo,
	anthropicDefaultModelId,
	anthropicModels,
	azureOpenAiDefaultApiVersion,
	bedrockDefaultModelId,
	bedrockModels,
	deepSeekDefaultModelId,
	deepSeekModels,
	geminiDefaultModelId,
	geminiModels,
	glamaDefaultModelId,
	glamaDefaultModelInfo,
	mistralDefaultModelId,
	mistralModels,
	openAiModelInfoSaneDefaults,
	openAiNativeDefaultModelId,
	openAiNativeModels,
	openRouterDefaultModelId,
	openRouterDefaultModelInfo,
	vertexDefaultModelId,
	vertexModels,
} from "../../../../src/shared/api"
import { ExtensionMessage } from "../../../../src/shared/ExtensionMessage"
import { useExtensionState } from "../../context/ExtensionStateContext"
import { vscode } from "../../utils/vscode"
import * as vscodemodels from "vscode"
import VSCodeButtonLink from "../common/VSCodeButtonLink"
import OpenRouterModelPicker, {
	ModelDescriptionMarkdown,
	OPENROUTER_MODEL_PICKER_Z_INDEX,
} from "./OpenRouterModelPicker"
import OpenAiModelPicker from "./OpenAiModelPicker"
import GlamaModelPicker from "./GlamaModelPicker"

interface ApiOptionsProps {
	apiErrorMessage?: string
	modelIdErrorMessage?: string
}

const ApiOptions = ({ apiErrorMessage, modelIdErrorMessage }: ApiOptionsProps) => {
	const { apiConfiguration, uriScheme, handleInputChange } = useExtensionState()
	const [ollamaModels, setOllamaModels] = useState<string[]>([])
	const [lmStudioModels, setLmStudioModels] = useState<string[]>([])
	const [vsCodeLmModels, setVsCodeLmModels] = useState<vscodemodels.LanguageModelChatSelector[]>([])
	const [anthropicBaseUrlSelected, setAnthropicBaseUrlSelected] = useState(!!apiConfiguration?.anthropicBaseUrl)
	const [azureApiVersionSelected, setAzureApiVersionSelected] = useState(!!apiConfiguration?.azureApiVersion)
	const [openRouterBaseUrlSelected, setOpenRouterBaseUrlSelected] = useState(!!apiConfiguration?.openRouterBaseUrl)
	const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)

	const { selectedProvider, selectedModelId, selectedModelInfo } = useMemo(() => {
		return normalizeApiConfiguration(apiConfiguration)
	}, [apiConfiguration])

	// Poll ollama/lmstudio models
	const requestLocalModels = useCallback(() => {
		if (selectedProvider === "ollama") {
			vscode.postMessage({ type: "requestOllamaModels", text: apiConfiguration?.ollamaBaseUrl })
		} else if (selectedProvider === "lmstudio") {
			vscode.postMessage({ type: "requestLmStudioModels", text: apiConfiguration?.lmStudioBaseUrl })
		} else if (selectedProvider === "vscode-lm") {
			vscode.postMessage({ type: "requestVsCodeLmModels" })
		}
	}, [selectedProvider, apiConfiguration?.ollamaBaseUrl, apiConfiguration?.lmStudioBaseUrl])
	useEffect(() => {
		if (selectedProvider === "ollama" || selectedProvider === "lmstudio" || selectedProvider === "vscode-lm") {
			requestLocalModels()
		}
	}, [selectedProvider, requestLocalModels])
	useInterval(
		requestLocalModels,
		selectedProvider === "ollama" || selectedProvider === "lmstudio" || selectedProvider === "vscode-lm"
			? 2000
			: null,
	)
	const handleMessage = useCallback((event: MessageEvent) => {
		const message: ExtensionMessage = event.data
		if (message.type === "ollamaModels" && message.ollamaModels) {
			setOllamaModels(message.ollamaModels)
		} else if (message.type === "lmStudioModels" && message.lmStudioModels) {
			setLmStudioModels(message.lmStudioModels)
		} else if (message.type === "vsCodeLmModels" && message.vsCodeLmModels) {
			setVsCodeLmModels(message.vsCodeLmModels)
		}
	}, [])
	useEvent("message", handleMessage)

	const createDropdown = (models: Record<string, ModelInfo>) => {
		const options: DropdownOption[] = [
			{ value: "", label: "选择一个模型..." },
			...Object.keys(models).map((modelId) => ({
				value: modelId,
				label: modelId,
			})),
		]
		return (
			<Dropdown
				id="model-id"
				value={selectedModelId}
				onChange={(value: unknown) => {
					handleInputChange("apiModelId")({
						target: {
							value: (value as DropdownOption).value,
						},
					})
				}}
				style={{ width: "100%" }}
				options={options}
			/>
		)
	}

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
			<div className="dropdown-container">
				<label htmlFor="api-provider">
					<span style={{ fontWeight: 500 }}>API 提供商</span>
				</label>
				<Dropdown
					id="api-provider"
					value={selectedProvider}
					onChange={(value: unknown) => {
						handleInputChange("apiProvider")({
							target: {
								value: (value as DropdownOption).value,
							},
						})
					}}
					style={{ minWidth: 130, position: "relative", zIndex: OPENROUTER_MODEL_PICKER_Z_INDEX + 1 }}
					options={[
						{ value: "openrouter", label: "OpenRouter" },
						{ value: "anthropic", label: "Anthropic" },
						{ value: "gemini", label: "Google Gemini" },
						{ value: "deepseek", label: "DeepSeek" },
						{ value: "openai-native", label: "OpenAI" },
						{ value: "openai", label: "OpenAI 兼容" },
						{ value: "vertex", label: "GCP Vertex AI" },
						{ value: "bedrock", label: "AWS Bedrock" },
						{ value: "glama", label: "Glama" },
						{ value: "vscode-lm", label: "VS Code LM API" },
						{ value: "mistral", label: "Mistral" },
						{ value: "lmstudio", label: "LM Studio" },
						{ value: "ollama", label: "Ollama" },
					]}
				/>
			</div>

			{selectedProvider === "anthropic" && (
				<div>
					<VSCodeTextField
						value={apiConfiguration?.apiKey || ""}
						style={{ width: "100%" }}
						type="password"
						onInput={handleInputChange("apiKey")}
						placeholder="输入 API 密钥...">
						<span style={{ fontWeight: 500 }}>Anthropic API 密钥</span>
					</VSCodeTextField>

					<Checkbox
						checked={anthropicBaseUrlSelected}
						onChange={(checked: boolean) => {
							setAnthropicBaseUrlSelected(checked)
							if (!checked) {
								handleInputChange("anthropicBaseUrl")({
									target: {
										value: "",
									},
								})
							}
						}}>
						使用自定义基础 URL
					</Checkbox>

					{anthropicBaseUrlSelected && (
						<VSCodeTextField
							value={apiConfiguration?.anthropicBaseUrl || ""}
							style={{ width: "100%", marginTop: 3 }}
							type="url"
							onInput={handleInputChange("anthropicBaseUrl")}
							placeholder="默认: https://api.anthropic.com"
						/>
					)}

					<p
						style={{
							fontSize: "12px",
							marginTop: 3,
							color: "var(--vscode-descriptionForeground)",
						}}>
						此密钥存储在本地，仅用于此扩展发出 API 请求。
						{!apiConfiguration?.apiKey && (
							<VSCodeLink
								href="https://console.anthropic.com/settings/keys"
								style={{ display: "inline", fontSize: "inherit" }}>
								您可以在此注册获取 Anthropic API 密钥。
							</VSCodeLink>
						)}
					</p>
				</div>
			)}

			{selectedProvider === "glama" && (
				<div>
					<VSCodeTextField
						value={apiConfiguration?.glamaApiKey || ""}
						style={{ width: "100%" }}
						type="password"
						onInput={handleInputChange("glamaApiKey")}
						placeholder="输入 API 密钥...">
						<span style={{ fontWeight: 500 }}>Glama API 密钥</span>
					</VSCodeTextField>
					{!apiConfiguration?.glamaApiKey && (
						<VSCodeButtonLink
							href={getGlamaAuthUrl(uriScheme)}
							style={{ margin: "5px 0 0 0" }}
							appearance="secondary">
							获取 Glama API 密钥
						</VSCodeButtonLink>
					)}
					<p
						style={{
							fontSize: "12px",
							marginTop: "5px",
							color: "var(--vscode-descriptionForeground)",
						}}>
						此密钥存储在本地，仅用于此扩展发出 API 请求。
					</p>
				</div>
			)}

			{selectedProvider === "openai-native" && (
				<div>
					<VSCodeTextField
						value={apiConfiguration?.openAiNativeApiKey || ""}
						style={{ width: "100%" }}
						type="password"
						onInput={handleInputChange("openAiNativeApiKey")}
						placeholder="输入 API 密钥...">
						<span style={{ fontWeight: 500 }}>OpenAI API 密钥</span>
					</VSCodeTextField>
					<p
						style={{
							fontSize: "12px",
							marginTop: 3,
							color: "var(--vscode-descriptionForeground)",
						}}>
						此密钥存储在本地，仅用于此扩展发出 API 请求。
						{!apiConfiguration?.openAiNativeApiKey && (
							<VSCodeLink
								href="https://platform.openai.com/api-keys"
								style={{ display: "inline", fontSize: "inherit" }}>
								您可以在此注册获取 OpenAI API 密钥。
							</VSCodeLink>
						)}
					</p>
				</div>
			)}

			{selectedProvider === "mistral" && (
				<div>
					<VSCodeTextField
						value={apiConfiguration?.mistralApiKey || ""}
						style={{ width: "100%" }}
						type="password"
						onInput={handleInputChange("mistralApiKey")}
						placeholder="输入 API 密钥...">
						<span style={{ fontWeight: 500 }}>Mistral API 密钥</span>
					</VSCodeTextField>
					<p
						style={{
							fontSize: "12px",
							marginTop: 3,
							color: "var(--vscode-descriptionForeground)",
						}}>
						此密钥存储在本地，仅用于此扩展发出 API 请求。
						{!apiConfiguration?.mistralApiKey && (
							<VSCodeLink
								href="https://console.mistral.ai/codestral/"
								style={{
									display: "inline",
									fontSize: "inherit",
								}}>
								您可以在此注册获取 Mistral API 密钥。
							</VSCodeLink>
						)}
					</p>
				</div>
			)}

			{selectedProvider === "openrouter" && (
				<div>
					<VSCodeTextField
						value={apiConfiguration?.openRouterApiKey || ""}
						style={{ width: "100%" }}
						type="password"
						onInput={handleInputChange("openRouterApiKey")}
						placeholder="输入 API 密钥...">
						<span style={{ fontWeight: 500 }}>OpenRouter API 密钥</span>
					</VSCodeTextField>
					{!apiConfiguration?.openRouterApiKey && (
						<p>
							<VSCodeButtonLink
								href={getOpenRouterAuthUrl(uriScheme)}
								style={{ margin: "5px 0 0 0" }}
								appearance="secondary">
								获取 OpenRouter API 密钥
							</VSCodeButtonLink>
						</p>
					)}
					<Checkbox
						checked={openRouterBaseUrlSelected}
						onChange={(checked: boolean) => {
							setOpenRouterBaseUrlSelected(checked)
							if (!checked) {
								handleInputChange("openRouterBaseUrl")({
									target: {
										value: "",
									},
								})
							}
						}}>
						使用自定义基础 URL
					</Checkbox>

					{openRouterBaseUrlSelected && (
						<VSCodeTextField
							value={apiConfiguration?.openRouterBaseUrl || ""}
							style={{ width: "100%", marginTop: 3 }}
							type="url"
							onInput={handleInputChange("openRouterBaseUrl")}
							placeholder="默认: https://openrouter.ai/api/v1"
						/>
					)}
					<p
						style={{
							fontSize: "12px",
							marginTop: "5px",
							color: "var(--vscode-descriptionForeground)",
						}}>
						此密钥存储在本地，仅用于此扩展发出 API 请求。{" "}
						{/* {!apiConfiguration?.openRouterApiKey && (
							<span style={{ color: "var(--vscode-charts-green)" }}>
								(<span style={{ fontWeight: 500 }}>注意:</span> OpenRouter 推荐用于高速率限制、提示缓存和更广泛的模型选择。)
							</span>
						)} */}
					</p>
					<Checkbox
						checked={apiConfiguration?.openRouterUseMiddleOutTransform || false}
						onChange={(checked: boolean) => {
							handleInputChange("openRouterUseMiddleOutTransform")({
								target: { value: checked },
							})
						}}>
						压缩提示和消息链到上下文大小 (
						<a href="https://openrouter.ai/docs/transforms">OpenRouter 转换</a>)
					</Checkbox>
					<br />
				</div>
			)}

			{selectedProvider === "bedrock" && (
				<div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
					<VSCodeRadioGroup
						value={apiConfiguration?.awsUseProfile ? "profile" : "credentials"}
						onChange={(e) => {
							const value = (e.target as HTMLInputElement)?.value
							const useProfile = value === "profile"
							handleInputChange("awsUseProfile")({
								target: { value: useProfile },
							})
						}}>
						<VSCodeRadio value="credentials">AWS 凭证</VSCodeRadio>
						<VSCodeRadio value="profile">AWS 配置文件</VSCodeRadio>
					</VSCodeRadioGroup>
					{/* AWS Profile Config Block */}
					{apiConfiguration?.awsUseProfile ? (
						<VSCodeTextField
							value={apiConfiguration?.awsProfile || ""}
							style={{ width: "100%" }}
							onInput={handleInputChange("awsProfile")}
							placeholder="输入配置文件名称">
							<span style={{ fontWeight: 500 }}>AWS 配置文件名称</span>
						</VSCodeTextField>
					) : (
						<>
							{/* AWS Credentials Config Block */}
							<VSCodeTextField
								value={apiConfiguration?.awsAccessKey || ""}
								style={{ width: "100%" }}
								type="password"
								onInput={handleInputChange("awsAccessKey")}
								placeholder="输入访问密钥...">
								<span style={{ fontWeight: 500 }}>AWS 访问密钥</span>
							</VSCodeTextField>
							<VSCodeTextField
								value={apiConfiguration?.awsSecretKey || ""}
								style={{ width: "100%" }}
								type="password"
								onInput={handleInputChange("awsSecretKey")}
								placeholder="输入秘密密钥...">
								<span style={{ fontWeight: 500 }}>AWS 秘密密钥</span>
							</VSCodeTextField>
							<VSCodeTextField
								value={apiConfiguration?.awsSessionToken || ""}
								style={{ width: "100%" }}
								type="password"
								onInput={handleInputChange("awsSessionToken")}
								placeholder="输入会话令牌...">
								<span style={{ fontWeight: 500 }}>AWS 会话令牌</span>
							</VSCodeTextField>
						</>
					)}
					<div className="dropdown-container">
						<label htmlFor="aws-region-dropdown">
							<span style={{ fontWeight: 500 }}>AWS 区域</span>
						</label>
						<Dropdown
							id="aws-region-dropdown"
							value={apiConfiguration?.awsRegion || ""}
							style={{ width: "100%" }}
							onChange={(value: unknown) => {
								handleInputChange("awsRegion")({
									target: {
										value: (value as DropdownOption).value,
									},
								})
							}}
							options={[
								{ value: "", label: "选择一个区域..." },
								{ value: "us-east-1", label: "us-east-1" },
								{ value: "us-east-2", label: "us-east-2" },
								{ value: "us-west-2", label: "us-west-2" },
								{ value: "ap-south-1", label: "ap-south-1" },
								{ value: "ap-northeast-1", label: "ap-northeast-1" },
								{ value: "ap-northeast-2", label: "ap-northeast-2" },
								{ value: "ap-southeast-1", label: "ap-southeast-1" },
								{ value: "ap-southeast-2", label: "ap-southeast-2" },
								{ value: "ca-central-1", label: "ca-central-1" },
								{ value: "eu-central-1", label: "eu-central-1" },
								{ value: "eu-west-1", label: "eu-west-1" },
								{ value: "eu-west-2", label: "eu-west-2" },
								{ value: "eu-west-3", label: "eu-west-3" },
								{ value: "sa-east-1", label: "sa-east-1" },
								{ value: "us-gov-west-1", label: "us-gov-west-1" },
							]}
						/>
					</div>
					<Checkbox
						checked={apiConfiguration?.awsUseCrossRegionInference || false}
						onChange={(checked: boolean) => {
							handleInputChange("awsUseCrossRegionInference")({
								target: { value: checked },
							})
						}}>
						使用跨域推理
					</Checkbox>
					<p
						style={{
							fontSize: "12px",
							marginTop: "5px",
							color: "var(--vscode-descriptionForeground)",
						}}>
						通过提供上述密钥进行身份验证，或使用默认的 AWS 凭证提供程序，例如 ~/.aws/credentials
						或环境变量。这些凭证仅在本地用于从此扩展发出 API 请求。
					</p>
				</div>
			)}

			{apiConfiguration?.apiProvider === "vertex" && (
				<div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
					<VSCodeTextField
						value={apiConfiguration?.vertexProjectId || ""}
						style={{ width: "100%" }}
						onInput={handleInputChange("vertexProjectId")}
						placeholder="输入项目 ID...">
						<span style={{ fontWeight: 500 }}>Google Cloud 项目 ID</span>
					</VSCodeTextField>
					<div className="dropdown-container">
						<label htmlFor="vertex-region-dropdown">
							<span style={{ fontWeight: 500 }}>Google Cloud 区域</span>
						</label>
						<Dropdown
							id="vertex-region-dropdown"
							value={apiConfiguration?.vertexRegion || ""}
							style={{ width: "100%" }}
							onChange={(value: unknown) => {
								handleInputChange("vertexRegion")({
									target: {
										value: (value as DropdownOption).value,
									},
								})
							}}
							options={[
								{ value: "", label: "选择一个区域..." },
								{ value: "us-east5", label: "us-east5" },
								{ value: "us-central1", label: "us-central1" },
								{ value: "europe-west1", label: "europe-west1" },
								{ value: "europe-west4", label: "europe-west4" },
								{ value: "asia-southeast1", label: "asia-southeast1" },
							]}
						/>
					</div>
					<p
						style={{
							fontSize: "12px",
							marginTop: "5px",
							color: "var(--vscode-descriptionForeground)",
						}}>
						要使用 Google Cloud Vertex AI，您需要
						<VSCodeLink
							href="https://cloud.google.com/vertex-ai/generative-ai/docs/partner-models/use-claude#before_you_begin"
							style={{ display: "inline", fontSize: "inherit" }}>
							{"1) 创建一个 Google Cloud 账户 › 启用 Vertex AI API › 启用所需的 Claude 模型,"}
						</VSCodeLink>{" "}
						<VSCodeLink
							href="https://cloud.google.com/docs/authentication/provide-credentials-adc#google-idp"
							style={{ display: "inline", fontSize: "inherit" }}>
							{"2) 安装 Google Cloud CLI › 配置应用程序默认凭据。"}
						</VSCodeLink>
					</p>
				</div>
			)}

			{selectedProvider === "gemini" && (
				<div>
					<VSCodeTextField
						value={apiConfiguration?.geminiApiKey || ""}
						style={{ width: "100%" }}
						type="password"
						onInput={handleInputChange("geminiApiKey")}
						placeholder="输入 API 密钥...">
						<span style={{ fontWeight: 500 }}>Gemini API 密钥</span>
					</VSCodeTextField>
					<p
						style={{
							fontSize: "12px",
							marginTop: 3,
							color: "var(--vscode-descriptionForeground)",
						}}>
						此密钥存储在本地，仅用于此扩展发出 API 请求。
						{!apiConfiguration?.geminiApiKey && (
							<VSCodeLink
								href="https://ai.google.dev/"
								style={{ display: "inline", fontSize: "inherit" }}>
								您可以在此注册获取 Gemini API 密钥。
							</VSCodeLink>
						)}
					</p>
				</div>
			)}

			{selectedProvider === "openai" && (
				<div>
					<VSCodeTextField
						value={apiConfiguration?.openAiBaseUrl || ""}
						style={{ width: "100%" }}
						type="url"
						onInput={handleInputChange("openAiBaseUrl")}
						placeholder={"输入基础 URL..."}>
						<span style={{ fontWeight: 500 }}>基础 URL</span>
					</VSCodeTextField>
					<VSCodeTextField
						value={apiConfiguration?.openAiApiKey || ""}
						style={{ width: "100%" }}
						type="password"
						onInput={handleInputChange("openAiApiKey")}
						placeholder="输入 API 密钥...">
						<span style={{ fontWeight: 500 }}>API 密钥</span>
					</VSCodeTextField>
					<OpenAiModelPicker />
					<div style={{ display: "flex", alignItems: "center" }}>
						<Checkbox
							checked={apiConfiguration?.openAiStreamingEnabled ?? true}
							onChange={(checked: boolean) => {
								handleInputChange("openAiStreamingEnabled")({
									target: { value: checked },
								})
							}}>
							启用流式传输
						</Checkbox>
					</div>
					<Checkbox
						checked={apiConfiguration?.openAiUseAzure ?? false}
						onChange={(checked: boolean) => {
							handleInputChange("openAiUseAzure")({
								target: { value: checked },
							})
						}}>
						使用 Azure
					</Checkbox>
					<Checkbox
						checked={azureApiVersionSelected}
						onChange={(checked: boolean) => {
							setAzureApiVersionSelected(checked)
							if (!checked) {
								handleInputChange("azureApiVersion")({
									target: {
										value: "",
									},
								})
							}
						}}>
						设置 Azure API 版本
					</Checkbox>
					{azureApiVersionSelected && (
						<VSCodeTextField
							value={apiConfiguration?.azureApiVersion || ""}
							style={{ width: "100%", marginTop: 3 }}
							onInput={handleInputChange("azureApiVersion")}
							placeholder={`默认: ${azureOpenAiDefaultApiVersion}`}
						/>
					)}

					<div
						style={{
							marginTop: 15,
						}}
					/>
					<Pane
						title="模型配置"
						open={false}
						actions={[
							{
								iconName: "refresh",
								onClick: () =>
									handleInputChange("openAiCustomModelInfo")({
										target: { value: openAiModelInfoSaneDefaults },
									}),
							},
						]}>
						<div
							style={{
								padding: 15,
								backgroundColor: "var(--vscode-editor-background)",
							}}>
							<p
								style={{
									fontSize: "12px",
									color: "var(--vscode-descriptionForeground)",
									margin: "0 0 15px 0",
									lineHeight: "1.4",
								}}>
								配置您的自定义 OpenAI 兼容模型的功能和定价。 <br />
								请小心模型功能，因为它们会影响 Roo Code 的工作方式。
							</p>

							{/* Capabilities Section */}
							<div
								style={{
									marginBottom: 20,
									padding: 12,
									backgroundColor: "var(--vscode-editor-inactiveSelectionBackground)",
									borderRadius: 4,
								}}>
								<span
									style={{
										fontWeight: 500,
										fontSize: "12px",
										display: "block",
										marginBottom: 12,
										color: "var(--vscode-editor-foreground)",
									}}>
									模型功能
								</span>
								<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
									<div className="token-config-field">
										<VSCodeTextField
											value={
												apiConfiguration?.openAiCustomModelInfo?.maxTokens?.toString() ||
												openAiModelInfoSaneDefaults.maxTokens?.toString() ||
												""
											}
											type="text"
											style={{
												width: "100%",
												borderColor: (() => {
													const value = apiConfiguration?.openAiCustomModelInfo?.maxTokens
													if (!value) return "var(--vscode-input-border)"
													return value > 0
														? "var(--vscode-charts-green)"
														: "var(--vscode-errorForeground)"
												})(),
											}}
											title="模型在单个响应中可以生成的最大令牌数"
											onChange={(e: any) => {
												const value = parseInt(e.target.value)
												handleInputChange("openAiCustomModelInfo")({
													target: {
														value: {
															...(apiConfiguration?.openAiCustomModelInfo ||
																openAiModelInfoSaneDefaults),
															maxTokens: isNaN(value) ? undefined : value,
														},
													},
												})
											}}
											placeholder="例如 4096">
											<span style={{ fontWeight: 500 }}>最大输出令牌数</span>
										</VSCodeTextField>
										<div
											style={{
												fontSize: "11px",
												color: "var(--vscode-descriptionForeground)",
												marginTop: 4,
												display: "flex",
												alignItems: "center",
												gap: 4,
											}}>
											<i className="codicon codicon-info" style={{ fontSize: "12px" }}></i>
											<span>
												模型在单个响应中可以生成的最大令牌数。 <br />
												（-1 取决于服务器）
											</span>
										</div>
									</div>

									<div className="token-config-field">
										<VSCodeTextField
											value={
												apiConfiguration?.openAiCustomModelInfo?.contextWindow?.toString() ||
												openAiModelInfoSaneDefaults.contextWindow?.toString() ||
												""
											}
											type="text"
											style={{
												width: "100%",
												borderColor: (() => {
													const value = apiConfiguration?.openAiCustomModelInfo?.contextWindow
													if (!value) return "var(--vscode-input-border)"
													return value > 0
														? "var(--vscode-charts-green)"
														: "var(--vscode-errorForeground)"
												})(),
											}}
											title="模型在单个请求中可以处理的总令牌数（输入 + 输出）"
											onChange={(e: any) => {
												const parsed = parseInt(e.target.value)
												handleInputChange("openAiCustomModelInfo")({
													target: {
														value: {
															...(apiConfiguration?.openAiCustomModelInfo ||
																openAiModelInfoSaneDefaults),
															contextWindow:
																e.target.value === ""
																	? undefined
																	: isNaN(parsed)
																		? openAiModelInfoSaneDefaults.contextWindow
																		: parsed,
														},
													},
												})
											}}
											placeholder="例如 128000">
											<span style={{ fontWeight: 500 }}>上下文窗口大小</span>
										</VSCodeTextField>
										<div
											style={{
												fontSize: "11px",
												color: "var(--vscode-descriptionForeground)",
												marginTop: 4,
												display: "flex",
												alignItems: "center",
												gap: 4,
											}}>
											<i className="codicon codicon-info" style={{ fontSize: "12px" }}></i>
											<span>
												模型在单个请求中可以处理的总令牌数（输入 + 输出）。这将帮助 Roo Code
												正常运行。
											</span>
										</div>
									</div>

									<div
										style={{
											backgroundColor: "var(--vscode-editor-background)",
											padding: "12px",
											borderRadius: "4px",
											marginTop: "8px",
											border: "1px solid var(--vscode-input-border)",
											transition: "background-color 0.2s ease",
										}}>
										<span
											style={{
												fontSize: "11px",
												fontWeight: 500,
												color: "var(--vscode-editor-foreground)",
												display: "block",
												marginBottom: "10px",
											}}>
											模型功能
										</span>

										<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
											<div className="feature-toggle">
												<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
													<Checkbox
														checked={
															apiConfiguration?.openAiCustomModelInfo?.supportsImages ??
															openAiModelInfoSaneDefaults.supportsImages
														}
														onChange={(checked: boolean) => {
															handleInputChange("openAiCustomModelInfo")({
																target: {
																	value: {
																		...(apiConfiguration?.openAiCustomModelInfo ||
																			openAiModelInfoSaneDefaults),
																		supportsImages: checked,
																	},
																},
															})
														}}>
														<span style={{ fontWeight: 500 }}>图像支持</span>
													</Checkbox>
													<i
														className="codicon codicon-info"
														title="如果模型可以处理和理解输入中的图像，请启用此功能。需要图像辅助和视觉代码理解。"
														style={{
															fontSize: "12px",
															color: "var(--vscode-descriptionForeground)",
															cursor: "help",
														}}
													/>
												</div>
												<p
													style={{
														fontSize: "11px",
														color: "var(--vscode-descriptionForeground)",
														marginLeft: "24px",
														marginTop: "4px",
														lineHeight: "1.4",
													}}>
													允许模型分析和理解图像，对于视觉代码辅助至关重要
												</p>
											</div>

											<div
												className="feature-toggle"
												style={{
													borderTop: "1px solid var(--vscode-input-border)",
													paddingTop: "12px",
												}}>
												<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
													<Checkbox
														checked={
															apiConfiguration?.openAiCustomModelInfo
																?.supportsComputerUse ?? false
														}
														onChange={(checked: boolean) => {
															handleInputChange("openAiCustomModelInfo")({
																target: {
																	value: {
																		...(apiConfiguration?.openAiCustomModelInfo ||
																			openAiModelInfoSaneDefaults),
																		supportsComputerUse: checked,
																	},
																},
															})
														}}>
														<span style={{ fontWeight: 500 }}>计算机使用</span>
													</Checkbox>
													<i
														className="codicon codicon-info"
														title="如果模型可以通过命令和文件操作与您的计算机交互，请启用此功能。需要自动化任务和文件修改。"
														style={{
															fontSize: "12px",
															color: "var(--vscode-descriptionForeground)",
															cursor: "help",
														}}
													/>
												</div>
												<p
													style={{
														fontSize: "11px",
														color: "var(--vscode-descriptionForeground)",
														marginLeft: "24px",
														marginTop: "4px",
														lineHeight: "1.4",
													}}>
													此模型功能用于计算机使用，如 sonnet 3.5 支持
												</p>
											</div>
										</div>
									</div>
								</div>
							</div>

							{/* Pricing Section */}
							<div
								style={{
									backgroundColor: "var(--vscode-editor-inactiveSelectionBackground)",
									padding: "12px",
									borderRadius: "4px",
									marginTop: "15px",
								}}>
								<div style={{ marginBottom: "12px" }}>
									<span
										style={{
											fontWeight: 500,
											fontSize: "12px",
											color: "var(--vscode-editor-foreground)",
											display: "block",
											marginBottom: "4px",
										}}>
										模型定价
									</span>
									<span
										style={{
											fontSize: "11px",
											color: "var(--vscode-descriptionForeground)",
											display: "block",
										}}>
										以每百万令牌的美元为单位配置基于令牌的定价
									</span>
								</div>

								<div
									style={{
										display: "grid",
										gridTemplateColumns: "1fr 1fr",
										gap: "12px",
										backgroundColor: "var(--vscode-editor-background)",
										padding: "12px",
										borderRadius: "4px",
									}}>
									<div className="price-input">
										<VSCodeTextField
											value={
												apiConfiguration?.openAiCustomModelInfo?.inputPrice?.toString() ??
												openAiModelInfoSaneDefaults.inputPrice?.toString() ??
												""
											}
											type="text"
											style={{
												width: "100%",
												borderColor: (() => {
													const value = apiConfiguration?.openAiCustomModelInfo?.inputPrice
													if (!value && value !== 0) return "var(--vscode-input-border)"
													return value >= 0
														? "var(--vscode-charts-green)"
														: "var(--vscode-errorForeground)"
												})(),
											}}
											onChange={(e: any) => {
												const parsed = parseFloat(e.target.value)
												handleInputChange("openAiCustomModelInfo")({
													target: {
														value: {
															...(apiConfiguration?.openAiCustomModelInfo ??
																openAiModelInfoSaneDefaults),
															inputPrice:
																e.target.value === ""
																	? undefined
																	: isNaN(parsed)
																		? openAiModelInfoSaneDefaults.inputPrice
																		: parsed,
														},
													},
												})
											}}
											placeholder="例如 0.0001">
											<div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
												<span style={{ fontWeight: 500 }}>输入价格</span>
												<i
													className="codicon codicon-info"
													title="输入/提示中的每百万令牌的成本。这会影响发送上下文和指令到模型的成本。"
													style={{
														fontSize: "12px",
														color: "var(--vscode-descriptionForeground)",
														cursor: "help",
													}}
												/>
											</div>
										</VSCodeTextField>
									</div>

									<div className="price-input">
										<VSCodeTextField
											value={
												apiConfiguration?.openAiCustomModelInfo?.outputPrice?.toString() ||
												openAiModelInfoSaneDefaults.outputPrice?.toString() ||
												""
											}
											type="text"
											style={{
												width: "100%",
												borderColor: (() => {
													const value = apiConfiguration?.openAiCustomModelInfo?.outputPrice
													if (!value && value !== 0) return "var(--vscode-input-border)"
													return value >= 0
														? "var(--vscode-charts-green)"
														: "var(--vscode-errorForeground)"
												})(),
											}}
											onChange={(e: any) => {
												const parsed = parseFloat(e.target.value)
												handleInputChange("openAiCustomModelInfo")({
													target: {
														value: {
															...(apiConfiguration?.openAiCustomModelInfo ||
																openAiModelInfoSaneDefaults),
															outputPrice:
																e.target.value === ""
																	? undefined
																	: isNaN(parsed)
																		? openAiModelInfoSaneDefaults.outputPrice
																		: parsed,
														},
													},
												})
											}}
											placeholder="例如 0.0002">
											<div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
												<span style={{ fontWeight: 500 }}>输出价格</span>
												<i
													className="codicon codicon-info"
													title="模型响应中的每百万令牌的成本。这会影响生成内容和完成的成本。"
													style={{
														fontSize: "12px",
														color: "var(--vscode-descriptionForeground)",
														cursor: "help",
													}}
												/>
											</div>
										</VSCodeTextField>
									</div>
								</div>
							</div>
						</div>
					</Pane>
					<div
						style={{
							marginTop: 15,
						}}
					/>

					{/* end Model Info Configuration */}

					<p
						style={{
							fontSize: "12px",
							marginTop: 3,
							color: "var(--vscode-descriptionForeground)",
						}}>
						<span style={{ color: "var(--vscode-errorForeground)" }}>
							(<span style={{ fontWeight: 500 }}>注意:</span> Roo Code 使用复杂的提示，最适合 Claude
							模型。功能较弱的模型可能无法按预期工作。)
						</span>
					</p>
				</div>
			)}

			{selectedProvider === "lmstudio" && (
				<div>
					<VSCodeTextField
						value={apiConfiguration?.lmStudioBaseUrl || ""}
						style={{ width: "100%" }}
						type="url"
						onInput={handleInputChange("lmStudioBaseUrl")}
						placeholder={"默认: http://localhost:1234"}>
						<span style={{ fontWeight: 500 }}>基础 URL（可选）</span>
					</VSCodeTextField>
					<VSCodeTextField
						value={apiConfiguration?.lmStudioModelId || ""}
						style={{ width: "100%" }}
						onInput={handleInputChange("lmStudioModelId")}
						placeholder={"例如 meta-llama-3.1-8b-instruct"}>
						<span style={{ fontWeight: 500 }}>模型 ID</span>
					</VSCodeTextField>
					{lmStudioModels.length > 0 && (
						<VSCodeRadioGroup
							value={
								lmStudioModels.includes(apiConfiguration?.lmStudioModelId || "")
									? apiConfiguration?.lmStudioModelId
									: ""
							}
							onChange={(e) => {
								const value = (e.target as HTMLInputElement)?.value
								// need to check value first since radio group returns empty string sometimes
								if (value) {
									handleInputChange("lmStudioModelId")({
										target: { value },
									})
								}
							}}>
							{lmStudioModels.map((model) => (
								<VSCodeRadio
									key={model}
									value={model}
									checked={apiConfiguration?.lmStudioModelId === model}>
									{model}
								</VSCodeRadio>
							))}
						</VSCodeRadioGroup>
					)}
					<p
						style={{
							fontSize: "12px",
							marginTop: "5px",
							color: "var(--vscode-descriptionForeground)",
						}}>
						LM Studio 允许您在本地计算机上运行模型。有关入门说明，请参阅其
						<VSCodeLink href="https://lmstudio.ai/docs" style={{ display: "inline", fontSize: "inherit" }}>
							快速入门指南。
						</VSCodeLink>
						您还需要启动 LM Studio 的{" "}
						<VSCodeLink
							href="https://lmstudio.ai/docs/basics/server"
							style={{ display: "inline", fontSize: "inherit" }}>
							本地服务器
						</VSCodeLink>{" "}
						功能才能与此扩展一起使用。{" "}
						<span style={{ color: "var(--vscode-errorForeground)" }}>
							(<span style={{ fontWeight: 500 }}>注意:</span> Roo Code 使用复杂的提示，最适合 Claude
							模型。功能较弱的模型可能无法按预期工作。)
						</span>
					</p>
				</div>
			)}

			{selectedProvider === "deepseek" && (
				<div>
					<VSCodeTextField
						value={apiConfiguration?.deepSeekApiKey || ""}
						style={{ width: "100%" }}
						type="password"
						onInput={handleInputChange("deepSeekApiKey")}
						placeholder="输入 API 密钥...">
						<span style={{ fontWeight: 500 }}>DeepSeek API 密钥</span>
					</VSCodeTextField>
					<p
						style={{
							fontSize: "12px",
							marginTop: "5px",
							color: "var(--vscode-descriptionForeground)",
						}}>
						此密钥存储在本地，仅用于此扩展发出 API 请求。
						{!apiConfiguration?.deepSeekApiKey && (
							<VSCodeLink
								href="https://platform.deepseek.com/"
								style={{ display: "inline", fontSize: "inherit" }}>
								您可以在此注册获取 DeepSeek API 密钥。
							</VSCodeLink>
						)}
					</p>
				</div>
			)}

			{selectedProvider === "vscode-lm" && (
				<div>
					<div className="dropdown-container">
						<label htmlFor="vscode-lm-model">
							<span style={{ fontWeight: 500 }}>语言模型</span>
						</label>
						{vsCodeLmModels.length > 0 ? (
							<Dropdown
								id="vscode-lm-model"
								value={
									apiConfiguration?.vsCodeLmModelSelector
										? `${apiConfiguration.vsCodeLmModelSelector.vendor ?? ""}/${apiConfiguration.vsCodeLmModelSelector.family ?? ""}`
										: ""
								}
								onChange={(value: unknown) => {
									const valueStr = (value as DropdownOption)?.value
									if (!valueStr) {
										return
									}
									const [vendor, family] = valueStr.split("/")
									handleInputChange("vsCodeLmModelSelector")({
										target: {
											value: { vendor, family },
										},
									})
								}}
								style={{ width: "100%" }}
								options={[
									{ value: "", label: "选择一个模型..." },
									...vsCodeLmModels.map((model) => ({
										value: `${model.vendor}/${model.family}`,
										label: `${model.vendor} - ${model.family}`,
									})),
								]}
							/>
						) : (
							<p
								style={{
									fontSize: "12px",
									marginTop: "5px",
									color: "var(--vscode-descriptionForeground)",
								}}>
								VS Code 语言模型 API 允许您运行其他 VS Code 扩展（包括但不限于 GitHub
								Copilot）提供的模型。 最简单的入门方式是从 VS Code 市场安装 Copilot 和 Copilot Chat
								扩展。
							</p>
						)}

						<p
							style={{
								fontSize: "12px",
								marginTop: "5px",
								color: "var(--vscode-errorForeground)",
								fontWeight: 500,
							}}>
							注意：这是一个实验性的集成，可能无法按预期工作。如有任何问题，请在 Roo-Code GitHub
							仓库报告。
						</p>
					</div>
				</div>
			)}

			{selectedProvider === "ollama" && (
				<div>
					<VSCodeTextField
						value={apiConfiguration?.ollamaBaseUrl || ""}
						style={{ width: "100%" }}
						type="url"
						onInput={handleInputChange("ollamaBaseUrl")}
						placeholder={"默认: http://localhost:11434"}>
						<span style={{ fontWeight: 500 }}>基础 URL（可选）</span>
					</VSCodeTextField>
					<VSCodeTextField
						value={apiConfiguration?.ollamaModelId || ""}
						style={{ width: "100%" }}
						onInput={handleInputChange("ollamaModelId")}
						placeholder={"例如 llama3.1"}>
						<span style={{ fontWeight: 500 }}>模型 ID</span>
					</VSCodeTextField>
					{ollamaModels.length > 0 && (
						<VSCodeRadioGroup
							value={
								ollamaModels.includes(apiConfiguration?.ollamaModelId || "")
									? apiConfiguration?.ollamaModelId
									: ""
							}
							onChange={(e) => {
								const value = (e.target as HTMLInputElement)?.value
								// need to check value first since radio group returns empty string sometimes
								if (value) {
									handleInputChange("ollamaModelId")({
										target: { value },
									})
								}
							}}>
							{ollamaModels.map((model) => (
								<VSCodeRadio
									key={model}
									value={model}
									checked={apiConfiguration?.ollamaModelId === model}>
									{model}
								</VSCodeRadio>
							))}
						</VSCodeRadioGroup>
					)}
					<p
						style={{
							fontSize: "12px",
							marginTop: "5px",
							color: "var(--vscode-descriptionForeground)",
						}}>
						Ollama 允许您在本地计算机上运行模型。有关入门说明，请参阅其
						<VSCodeLink
							href="https://github.com/ollama/ollama/blob/main/README.md"
							style={{ display: "inline", fontSize: "inherit" }}>
							快速入门指南。
						</VSCodeLink>
						<span style={{ color: "var(--vscode-errorForeground)" }}>
							(<span style={{ fontWeight: 500 }}>注意:</span> Roo Code 使用复杂的提示，最适合 Claude
							模型。功能较弱的模型可能无法按预期工作。)
						</span>
					</p>
				</div>
			)}

			{apiErrorMessage && (
				<p
					style={{
						margin: "-10px 0 4px 0",
						fontSize: 12,
						color: "var(--vscode-errorForeground)",
					}}>
					{apiErrorMessage}
				</p>
			)}

			{selectedProvider === "glama" && <GlamaModelPicker />}

			{selectedProvider === "openrouter" && <OpenRouterModelPicker />}

			{selectedProvider !== "glama" &&
				selectedProvider !== "openrouter" &&
				selectedProvider !== "openai" &&
				selectedProvider !== "ollama" &&
				selectedProvider !== "lmstudio" && (
					<>
						<div className="dropdown-container">
							<label htmlFor="model-id">
								<span style={{ fontWeight: 500 }}>模型</span>
							</label>
							{selectedProvider === "anthropic" && createDropdown(anthropicModels)}
							{selectedProvider === "bedrock" && createDropdown(bedrockModels)}
							{selectedProvider === "vertex" && createDropdown(vertexModels)}
							{selectedProvider === "gemini" && createDropdown(geminiModels)}
							{selectedProvider === "openai-native" && createDropdown(openAiNativeModels)}
							{selectedProvider === "deepseek" && createDropdown(deepSeekModels)}
							{selectedProvider === "mistral" && createDropdown(mistralModels)}
						</div>

						<ModelInfoView
							selectedModelId={selectedModelId}
							modelInfo={selectedModelInfo}
							isDescriptionExpanded={isDescriptionExpanded}
							setIsDescriptionExpanded={setIsDescriptionExpanded}
						/>
					</>
				)}

			{modelIdErrorMessage && (
				<p
					style={{
						margin: "-10px 0 4px 0",
						fontSize: 12,
						color: "var(--vscode-errorForeground)",
					}}>
					{modelIdErrorMessage}
				</p>
			)}
		</div>
	)
}

export function getGlamaAuthUrl(uriScheme?: string) {
	const callbackUrl = `${uriScheme || "vscode"}://rooveterinaryinc.roo-cline/glama`

	return `https://glama.ai/oauth/authorize?callback_url=${encodeURIComponent(callbackUrl)}`
}

export function getOpenRouterAuthUrl(uriScheme?: string) {
	return `https://openrouter.ai/auth?callback_url=${uriScheme || "vscode"}://rooveterinaryinc.roo-cline/openrouter`
}

export const formatPrice = (price: number) => {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(price)
}

export const ModelInfoView = ({
	selectedModelId,
	modelInfo,
	isDescriptionExpanded,
	setIsDescriptionExpanded,
}: {
	selectedModelId: string
	modelInfo: ModelInfo
	isDescriptionExpanded: boolean
	setIsDescriptionExpanded: (isExpanded: boolean) => void
}) => {
	const isGemini = Object.keys(geminiModels).includes(selectedModelId)

	const infoItems = [
		modelInfo.description && (
			<ModelDescriptionMarkdown
				key="description"
				markdown={modelInfo.description}
				isExpanded={isDescriptionExpanded}
				setIsExpanded={setIsDescriptionExpanded}
			/>
		),
		<ModelInfoSupportsItem
			key="supportsImages"
			isSupported={modelInfo.supportsImages ?? false}
			supportsLabel="支持图像"
			doesNotSupportLabel="不支持图像"
		/>,
		<ModelInfoSupportsItem
			key="supportsComputerUse"
			isSupported={modelInfo.supportsComputerUse ?? false}
			supportsLabel="支持计算机使用"
			doesNotSupportLabel="不支持计算机使用"
		/>,
		!isGemini && (
			<ModelInfoSupportsItem
				key="supportsPromptCache"
				isSupported={modelInfo.supportsPromptCache}
				supportsLabel="支持提示缓存"
				doesNotSupportLabel="不支持提示缓存"
			/>
		),
		modelInfo.maxTokens !== undefined && modelInfo.maxTokens > 0 && (
			<span key="maxTokens">
				<span style={{ fontWeight: 500 }}>最大输出:</span> {modelInfo.maxTokens?.toLocaleString()} 令牌
			</span>
		),
		modelInfo.inputPrice !== undefined && modelInfo.inputPrice > 0 && (
			<span key="inputPrice">
				<span style={{ fontWeight: 500 }}>输入价格:</span> {formatPrice(modelInfo.inputPrice)}/百万令牌
			</span>
		),
		modelInfo.supportsPromptCache && modelInfo.cacheWritesPrice && (
			<span key="cacheWritesPrice">
				<span style={{ fontWeight: 500 }}>缓存写入价格:</span> {formatPrice(modelInfo.cacheWritesPrice || 0)}
				/百万令牌
			</span>
		),
		modelInfo.supportsPromptCache && modelInfo.cacheReadsPrice && (
			<span key="cacheReadsPrice">
				<span style={{ fontWeight: 500 }}>缓存读取价格:</span> {formatPrice(modelInfo.cacheReadsPrice || 0)}
				/百万令牌
			</span>
		),
		modelInfo.outputPrice !== undefined && modelInfo.outputPrice > 0 && (
			<span key="outputPrice">
				<span style={{ fontWeight: 500 }}>输出价格:</span> {formatPrice(modelInfo.outputPrice)}/百万令牌
			</span>
		),
		isGemini && (
			<span key="geminiInfo" style={{ fontStyle: "italic" }}>
				* 每分钟最多免费 {selectedModelId && selectedModelId.includes("flash") ? "15" : "2"} 次请求。
				之后，计费取决于提示大小。{" "}
				<VSCodeLink href="https://ai.google.dev/pricing" style={{ display: "inline", fontSize: "inherit" }}>
					有关更多信息，请参阅定价详情。
				</VSCodeLink>
			</span>
		),
	].filter(Boolean)

	return (
		<p style={{ fontSize: "12px", marginTop: "2px", color: "var(--vscode-descriptionForeground)" }}>
			{infoItems.map((item, index) => (
				<Fragment key={index}>
					{item}
					{index < infoItems.length - 1 && <br />}
				</Fragment>
			))}
		</p>
	)
}

const ModelInfoSupportsItem = ({
	isSupported,
	supportsLabel,
	doesNotSupportLabel,
}: {
	isSupported: boolean
	supportsLabel: string
	doesNotSupportLabel: string
}) => (
	<span
		style={{
			fontWeight: 500,
			color: isSupported ? "var(--vscode-charts-green)" : "var(--vscode-errorForeground)",
		}}>
		<i
			className={`codicon codicon-${isSupported ? "check" : "x"}`}
			style={{
				marginRight: 4,
				marginBottom: isSupported ? 1 : -1,
				fontSize: isSupported ? 11 : 13,
				fontWeight: 700,
				display: "inline-block",
				verticalAlign: "bottom",
			}}></i>
		{isSupported ? supportsLabel : doesNotSupportLabel}
	</span>
)

export function normalizeApiConfiguration(apiConfiguration?: ApiConfiguration) {
	const provider = apiConfiguration?.apiProvider || "anthropic"
	const modelId = apiConfiguration?.apiModelId

	const getProviderData = (models: Record<string, ModelInfo>, defaultId: string) => {
		let selectedModelId: string
		let selectedModelInfo: ModelInfo
		if (modelId && modelId in models) {
			selectedModelId = modelId
			selectedModelInfo = models[modelId]
		} else {
			selectedModelId = defaultId
			selectedModelInfo = models[defaultId]
		}
		return { selectedProvider: provider, selectedModelId, selectedModelInfo }
	}
	switch (provider) {
		case "anthropic":
			return getProviderData(anthropicModels, anthropicDefaultModelId)
		case "bedrock":
			return getProviderData(bedrockModels, bedrockDefaultModelId)
		case "vertex":
			return getProviderData(vertexModels, vertexDefaultModelId)
		case "gemini":
			return getProviderData(geminiModels, geminiDefaultModelId)
		case "deepseek":
			return getProviderData(deepSeekModels, deepSeekDefaultModelId)
		case "openai-native":
			return getProviderData(openAiNativeModels, openAiNativeDefaultModelId)
		case "glama":
			return {
				selectedProvider: provider,
				selectedModelId: apiConfiguration?.glamaModelId || glamaDefaultModelId,
				selectedModelInfo: apiConfiguration?.glamaModelInfo || glamaDefaultModelInfo,
			}
		case "mistral":
			return getProviderData(mistralModels, mistralDefaultModelId)
		case "openrouter":
			return {
				selectedProvider: provider,
				selectedModelId: apiConfiguration?.openRouterModelId || openRouterDefaultModelId,
				selectedModelInfo: apiConfiguration?.openRouterModelInfo || openRouterDefaultModelInfo,
			}
		case "openai":
			return {
				selectedProvider: provider,
				selectedModelId: apiConfiguration?.openAiModelId || "",
				selectedModelInfo: apiConfiguration?.openAiCustomModelInfo || openAiModelInfoSaneDefaults,
			}
		case "ollama":
			return {
				selectedProvider: provider,
				selectedModelId: apiConfiguration?.ollamaModelId || "",
				selectedModelInfo: openAiModelInfoSaneDefaults,
			}
		case "lmstudio":
			return {
				selectedProvider: provider,
				selectedModelId: apiConfiguration?.lmStudioModelId || "",
				selectedModelInfo: openAiModelInfoSaneDefaults,
			}
		case "vscode-lm":
			return {
				selectedProvider: provider,
				selectedModelId: apiConfiguration?.vsCodeLmModelSelector
					? `${apiConfiguration.vsCodeLmModelSelector.vendor}/${apiConfiguration.vsCodeLmModelSelector.family}`
					: "",
				selectedModelInfo: {
					...openAiModelInfoSaneDefaults,
					supportsImages: false, // VSCode LM API currently doesn't support images
				},
			}
		default:
			return getProviderData(anthropicModels, anthropicDefaultModelId)
	}
}

export default memo(ApiOptions)
