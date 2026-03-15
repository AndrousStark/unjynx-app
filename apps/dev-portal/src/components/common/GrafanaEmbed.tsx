// ============================================================
// UNJYNX Dev Portal - Grafana Embed Component
// ============================================================

import { Card, Empty } from "antd";
import { GRAFANA_BASE_URL } from "@/utils/constants";

interface GrafanaEmbedProps {
  readonly dashboardUid: string;
  readonly panelId?: number;
  readonly title?: string;
  readonly height?: number;
  readonly from?: string;
  readonly to?: string;
  readonly theme?: "light" | "dark";
  readonly refresh?: string;
}

export const GrafanaEmbed: React.FC<GrafanaEmbedProps> = ({
  dashboardUid,
  panelId,
  title,
  height = 400,
  from = "now-6h",
  to = "now",
  theme = "dark",
  refresh = "30s",
}) => {
  const params = new URLSearchParams({
    orgId: "1",
    from,
    to,
    theme,
    refresh,
  });

  if (panelId !== undefined) {
    params.set("panelId", String(panelId));
    params.set("viewPanel", String(panelId));
  }

  const embedUrl = panelId
    ? `${GRAFANA_BASE_URL}/d-solo/${dashboardUid}?${params}`
    : `${GRAFANA_BASE_URL}/d/${dashboardUid}?${params}&kiosk`;

  if (!GRAFANA_BASE_URL || GRAFANA_BASE_URL === "http://localhost:3100") {
    return (
      <Card
        title={title}
        style={{ height }}
        styles={{ body: { display: "flex", alignItems: "center", justifyContent: "center" } }}
        data-testid="grafana-embed"
      >
        <Empty
          description={
            <>
              Grafana dashboard: <code>{dashboardUid}</code>
              {panelId !== undefined && (
                <>
                  {" "}/ Panel: <code>{panelId}</code>
                </>
              )}
              <br />
              <small style={{ color: "#9CA3AF" }}>
                Configure VITE_GRAFANA_URL to enable live dashboards
              </small>
            </>
          }
        />
      </Card>
    );
  }

  return (
    <Card title={title} styles={{ body: { padding: 0 } }} data-testid="grafana-embed">
      <iframe
        src={embedUrl}
        width="100%"
        height={height}
        frameBorder="0"
        title={title ?? `Grafana: ${dashboardUid}`}
        style={{ border: "none", borderRadius: "0 0 8px 8px" }}
        sandbox="allow-scripts allow-same-origin"
      />
    </Card>
  );
};
