import { Breadcrumb } from "antd";

interface PageHeaderProps {
  title: string;
  breadcrumb: { title: string; path?: string }[];
}

export default function PageHeader({ title, breadcrumb }: PageHeaderProps) {
  return (
    <div style={{ marginBottom: 24 }}>
      <Breadcrumb
        items={breadcrumb.map((item) => ({
          title: item.path ? (
            <a href={item.path}>{item.title}</a>
          ) : (
            item.title
          ),
        }))}
        style={{ marginBottom: 12, color: "green" }}
      />
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "green" }}>{title}</h2>
    </div>
  );
}
