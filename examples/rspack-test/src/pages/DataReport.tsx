import { Card, Row, Col, Table, Tag, Badge } from "antd";
import PageHeader from "../components/common/PageHeader";
import { monthlyReports } from "../data/mock";

function MiniBar({ values }: { values: number[] }) {
  const max = Math.max(...values);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 40 }}>
      {values.map((v, i) => (
        <div
          key={i}
          style={{
            width: 8,
            height: `${(v / max) * 100}%`,
            background: "#1677ff",
            borderRadius: 2,
            minHeight: 4,
            opacity: 0.6 + i * 0.03,
          }}
        />
      ))}
    </div>
  );
}

function MiniLine({ values }: { values: number[] }) {
  const max = Math.max(...values);
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = 100 - (v / max) * 100;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: 60 }}>
      <polyline
        points={points}
        fill="none"
        stroke="#52c41a"
        strokeWidth={2}
      />
    </svg>
  );
}

export default function DataReport() {
  const revenueValues = monthlyReports.map((r) => r.revenue);
  const userValues = monthlyReports.map((r) => r.users);
  const orderValues = monthlyReports.map((r) => r.orders);

  const columns = [
    { title: "月份", dataIndex: "month", key: "month" },
    {
      title: "营收",
      dataIndex: "revenue",
      key: "revenue",
      render: (v: number) => `¥${v.toLocaleString()}`,
    },
    { title: "新增用户", dataIndex: "users", key: "users" },
    { title: "订单数", dataIndex: "orders", key: "orders" },
    {
      title: "转化率",
      dataIndex: "conversion",
      key: "conversion",
      render: (v: number) => (
        <Tag color={v >= 28 ? "green" : v >= 24 ? "blue" : "orange"}>{v}%</Tag>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="数据报表"
        breadcrumb={[
          { title: "首页", path: "/" },
          { title: "数据报表" },
        ]}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="营收趋势" bordered={false}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ color: "#666" }}>年度总营收</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: "#1677ff" }}>
                ¥{revenueValues.reduce((a, b) => a + b, 0).toLocaleString()}
              </span>
            </div>
            <MiniBar values={revenueValues} />
            <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", fontSize: 12, color: "#999" }}>
              <span>1月</span>
              <span>12月</span>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="用户增长" bordered={false}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ color: "#666" }}>年度新增</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: "#52c41a" }}>
                {userValues.reduce((a, b) => a + b, 0).toLocaleString()} 人
              </span>
            </div>
            <MiniLine values={userValues} />
            <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", fontSize: 12, color: "#999" }}>
              <span>1月</span>
              <span>12月</span>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="订单趋势" bordered={false}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ color: "#666" }}>年度总订单</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: "#faad14" }}>
                {orderValues.reduce((a, b) => a + b, 0).toLocaleString()} 单
              </span>
            </div>
            <MiniBar values={orderValues} />
            <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", fontSize: 12, color: "#999" }}>
              <span>1月</span>
              <span>12月</span>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card title="月度数据明细" bordered={false}>
            <Table
              columns={columns}
              dataSource={monthlyReports}
              rowKey="month"
              pagination={false}
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0}><strong>合计</strong></Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <strong>¥{revenueValues.reduce((a, b) => a + b, 0).toLocaleString()}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2}>
                    <strong>{userValues.reduce((a, b) => a + b, 0).toLocaleString()}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3}>
                    <strong>{orderValues.reduce((a, b) => a + b, 0).toLocaleString()}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4}>
                    <Badge
                      status="success"
                      text={`平均 ${(monthlyReports.reduce((a, b) => a + b.conversion, 0) / monthlyReports.length).toFixed(1)}%`}
                    />
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
