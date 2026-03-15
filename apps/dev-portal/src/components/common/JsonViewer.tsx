// ============================================================
// UNJYNX Dev Portal - JSON Viewer Component
// ============================================================

import { Typography, Button, message } from "antd";
import { CopyOutlined } from "@ant-design/icons";

interface JsonViewerProps {
  readonly data: unknown;
  readonly title?: string;
  readonly maxHeight?: number;
  readonly collapsed?: boolean;
}

const syntaxHighlight = (json: string): string =>
  json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      let color = "#E5E7EB"; // number
      if (/^"/.test(match)) {
        color = match.endsWith(":") ? "#FFD700" : "#10B981"; // key : string
      } else if (/true|false/.test(match)) {
        color = "#6C5CE7"; // boolean
      } else if (/null/.test(match)) {
        color = "#EF4444"; // null
      }
      return `<span style="color:${color}">${match}</span>`;
    }
  );

export const JsonViewer: React.FC<JsonViewerProps> = ({
  data,
  title,
  maxHeight = 400,
}) => {
  const jsonStr = JSON.stringify(data, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonStr);
      message.success("JSON copied to clipboard");
    } catch {
      message.error("Failed to copy");
    }
  };

  return (
    <div
      style={{
        borderRadius: 8,
        overflow: "hidden",
        border: "1px solid #2D2640",
      }}
      data-testid="json-viewer"
    >
      {title && (
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
          <Typography.Text style={{ color: "#9CA3AF", fontSize: 12 }}>
            {title}
          </Typography.Text>
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={handleCopy}
            style={{ color: "#9CA3AF" }}
          >
            Copy
          </Button>
        </div>
      )}
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
        }}
        dangerouslySetInnerHTML={{ __html: syntaxHighlight(jsonStr) }}
      />
    </div>
  );
};
