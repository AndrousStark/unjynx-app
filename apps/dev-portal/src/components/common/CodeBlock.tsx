// ============================================================
// UNJYNX Dev Portal - Code Block Component
// ============================================================

import { Typography, Button, message } from "antd";
import { CopyOutlined } from "@ant-design/icons";

interface CodeBlockProps {
  readonly code: string;
  readonly language?: string;
  readonly maxHeight?: number;
  readonly showCopy?: boolean;
  readonly showLineNumbers?: boolean;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = "sql",
  maxHeight = 300,
  showCopy = true,
  showLineNumbers = false,
}) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      message.success("Copied to clipboard");
    } catch {
      message.error("Failed to copy");
    }
  };

  const lines = code.split("\n");

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 8,
        overflow: "hidden",
        border: "1px solid #2D2640",
      }}
      data-testid="code-block"
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "6px 12px",
          background: "#1A1528",
          borderBottom: "1px solid #2D2640",
        }}
      >
        <Typography.Text
          style={{
            color: "#9CA3AF",
            fontSize: 12,
            fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
          }}
        >
          {language}
        </Typography.Text>
        {showCopy && (
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={handleCopy}
            style={{ color: "#9CA3AF" }}
          >
            Copy
          </Button>
        )}
      </div>
      <pre
        style={{
          margin: 0,
          padding: 12,
          background: "#0F0A1A",
          maxHeight,
          overflow: "auto",
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontSize: 13,
          lineHeight: 1.6,
          color: "#E5E7EB",
        }}
      >
        {showLineNumbers
          ? lines.map((line, i) => (
              <div key={i} style={{ display: "flex" }}>
                <span
                  style={{
                    minWidth: 40,
                    textAlign: "right",
                    paddingRight: 12,
                    color: "#4B5563",
                    userSelect: "none",
                  }}
                >
                  {i + 1}
                </span>
                <span>{line}</span>
              </div>
            ))
          : code}
      </pre>
    </div>
  );
};
