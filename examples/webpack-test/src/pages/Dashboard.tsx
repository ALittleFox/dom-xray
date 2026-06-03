import { Row, Col, Card, Statistic, List, Tag, Progress, Button } from "antd";
import {
  ArrowUpOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  RiseOutlined,
} from "@ant-design/icons";
import PageHeader from "../components/common/PageHeader";
import { overviewStats, todos } from "../data/mock";

export default function Dashboard() {
  return (
    <div>
      <PageHeader
        title="仪表盘"
        breadcrumb={[{ title: "首页", path: "/" }, { title: "仪表盘" }]}
      />

      <Row gutter={[16, 16]}>
        {overviewStats.map((stat) => (
          <Col xs={24} sm={12} lg={6} key={stat.title}>
            <Card bordered={false} hoverable>
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={stat.prefix}
                suffix={stat.suffix}
                valueStyle={{ color: stat.color, fontWeight: 700, fontSize: 28 }}
              />
              <div style={{ marginTop: 8, fontSize: 13, color: "#52c41a" }}>
                <ArrowUpOutlined /> {stat.trend} 较上月
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="待办事项" bordered={false}>
            <List
              dataSource={todos}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Tag
                      color={
                        item.priority === "high"
                          ? "red"
                          : item.priority === "medium"
                          ? "orange"
                          : "green"
                      }
                      key="priority"
                    >
                      {item.priority === "high"
                        ? "高"
                        : item.priority === "medium"
                        ? "中"
                        : "低"}
                    </Tag>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      item.completed ? (
                        <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 18 }} />
                      ) : (
                        <ClockCircleOutlined style={{ color: "#faad14", fontSize: 18 }} />
                      )
                    }
                    title={
                      <span
                        style={{
                          textDecoration: item.completed ? "line-through" : "none",
                          color: item.completed ? "#999" : "#333",
                        }}
                      >
                        {item.title}
                      </span>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="系统状态" bordered={false}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span>CPU 使用率</span>
                <span>42%</span>
              </div>
              <Progress percent={42} status="active" strokeColor="#1677ff" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span>内存使用率</span>
                <span>68%</span>
              </div>
              <Progress percent={68} status="active" strokeColor="#52c41a" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span>磁盘空间</span>
                <span>85%</span>
              </div>
              <Progress percent={85} status="exception" />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span>网络带宽</span>
                <span>32%</span>
              </div>
              <Progress percent={32} status="active" strokeColor="#faad14" />
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card title="快速操作" bordered={false}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Button type="primary" icon={<RiseOutlined />} size="large">
                导出报表
              </Button>
              <Button icon={<CheckCircleOutlined />} size="large">
                批量审核
              </Button>
              <Button size="large">数据同步</Button>
              <Button size="large">系统设置</Button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
