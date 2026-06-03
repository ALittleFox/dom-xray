import { useState } from "react";
import {
  Table, Tag, Avatar, Button, Input, Space, Card, Modal, Form, Select, message,
} from "antd";
import {
  SearchOutlined, EditOutlined, DeleteOutlined, PlusOutlined,
} from "@ant-design/icons";
import PageHeader from "../components/common/PageHeader";
import { users } from "../data/mock";
import type { User } from "../data/mock";

export default function UserManagement() {
  const [data, setData] = useState<User[]>(users);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  const filtered = data.filter(
    (u) =>
      u.name.includes(search) ||
      u.email.includes(search) ||
      u.id.includes(search)
  );

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: "确认删除",
      content: "删除后无法恢复，是否继续？",
      okText: "确认",
      cancelText: "取消",
      onOk: () => {
        setData((prev) => prev.filter((u) => u.id !== id));
        message.success("删除成功");
      },
    });
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue(user);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleSave = () => {
    form.validateFields().then((values) => {
      if (editingUser) {
        setData((prev) =>
          prev.map((u) => (u.id === editingUser.id ? { ...u, ...values } : u))
        );
        message.success("更新成功");
      } else {
        const newUser: User = {
          ...values,
          id: `U${String(data.length + 1).padStart(3, "0")}`,
          createdAt: new Date().toISOString().slice(0, 10),
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${values.name}`,
        };
        setData((prev) => [newUser, ...prev]);
        message.success("添加成功");
      }
      setIsModalOpen(false);
    });
  };

  const columns = [
    {
      title: "用户",
      dataIndex: "name",
      key: "name",
      render: (_: string, record: User) => (
        <Space>
          <Avatar src={record.avatar} size="small" />
          <span>{record.name}</span>
        </Space>
      ),
    },
    { title: "ID", dataIndex: "id", key: "id" },
    { title: "邮箱", dataIndex: "email", key: "email" },
    {
      title: "角色",
      dataIndex: "role",
      key: "role",
      render: (role: string) => (
        <Tag
          color={
            role === "admin" ? "red" : role === "editor" ? "blue" : "green"
          }
        >
          {role === "admin" ? "管理员" : role === "editor" ? "编辑" : "访客"}
        </Tag>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={status === "active" ? "success" : "default"}>
          {status === "active" ? "活跃" : "停用"}
        </Tag>
      ),
    },
    { title: "注册时间", dataIndex: "createdAt", key: "createdAt" },
    {
      title: "操作",
      key: "action",
      render: (_: unknown, record: User) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="用户管理"
        breadcrumb={[
          { title: "首页", path: "/" },
          { title: "用户管理" },
        ]}
      />

      <Card bordered={false}>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="搜索用户名 / 邮箱 / ID"
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 280 }}
            allowClear
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增用户
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          pagination={{ pageSize: 5 }}
        />
      </Card>

      <Modal
        title={editingUser ? "编辑用户" : "新增用户"}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="用户名"
            rules={[{ required: true, message: "请输入用户名" }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: "请输入邮箱" },
              { type: "email", message: "邮箱格式不正确" },
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: "请选择角色" }]}
          >
            <Select placeholder="请选择角色">
              <Select.Option value="admin">管理员</Select.Option>
              <Select.Option value="editor">编辑</Select.Option>
              <Select.Option value="viewer">访客</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: "请选择状态" }]}
          >
            <Select placeholder="请选择状态">
              <Select.Option value="active">活跃</Select.Option>
              <Select.Option value="inactive">停用</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
