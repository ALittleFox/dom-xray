export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "editor" | "viewer";
  status: "active" | "inactive";
  createdAt: string;
  avatar: string;
}

export interface ReportItem {
  month: string;
  revenue: number;
  users: number;
  orders: number;
  conversion: number;
}

export interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  priority: "high" | "medium" | "low";
}

export const users: User[] = [
  { id: "U001", name: "张三", email: "zhangsan@example.com", role: "admin", status: "active", createdAt: "2024-01-15", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan" },
  { id: "U002", name: "李四", email: "lisi@example.com", role: "editor", status: "active", createdAt: "2024-02-20", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=lisi" },
  { id: "U003", name: "王五", email: "wangwu@example.com", role: "viewer", status: "inactive", createdAt: "2024-03-10", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=wangwu" },
  { id: "U004", name: "赵六", email: "zhaoliu@example.com", role: "editor", status: "active", createdAt: "2024-04-05", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=zhaoliu" },
  { id: "U005", name: "孙七", email: "sunqi@example.com", role: "viewer", status: "active", createdAt: "2024-05-12", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sunqi" },
  { id: "U006", name: "周八", email: "zhouba@example.com", role: "admin", status: "inactive", createdAt: "2024-06-01", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=zhouba" },
  { id: "U007", name: "吴九", email: "wujiu@example.com", role: "editor", status: "active", createdAt: "2024-06-18", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=wujiu" },
  { id: "U008", name: "郑十", email: "zhengshi@example.com", role: "viewer", status: "active", createdAt: "2024-07-03", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=zhengshi" },
];

export const monthlyReports: ReportItem[] = [
  { month: "1月", revenue: 120000, users: 3500, orders: 820, conversion: 23.4 },
  { month: "2月", revenue: 98000, users: 3100, orders: 650, conversion: 21.0 },
  { month: "3月", revenue: 145000, users: 4200, orders: 1100, conversion: 26.2 },
  { month: "4月", revenue: 132000, users: 3900, orders: 980, conversion: 25.1 },
  { month: "5月", revenue: 168000, users: 4800, orders: 1350, conversion: 28.1 },
  { month: "6月", revenue: 156000, users: 4500, orders: 1200, conversion: 26.7 },
  { month: "7月", revenue: 189000, users: 5200, orders: 1580, conversion: 30.4 },
  { month: "8月", revenue: 175000, users: 4900, orders: 1420, conversion: 29.0 },
  { month: "9月", revenue: 198000, users: 5500, orders: 1680, conversion: 30.5 },
  { month: "10月", revenue: 210000, users: 5800, orders: 1820, conversion: 31.4 },
  { month: "11月", revenue: 225000, users: 6200, orders: 1950, conversion: 31.5 },
  { month: "12月", revenue: 245000, users: 6800, orders: 2100, conversion: 30.9 },
];

export const todos: TodoItem[] = [
  { id: "T001", title: "审核新注册用户", completed: false, priority: "high" },
  { id: "T002", title: "更新系统日志", completed: true, priority: "medium" },
  { id: "T003", title: "导出月度报表", completed: false, priority: "high" },
  { id: "T004", title: "优化首页加载速度", completed: true, priority: "low" },
  { id: "T005", title: "检查数据备份", completed: false, priority: "medium" },
];

export const overviewStats = [
  { title: "总用户数", value: 6842, prefix: "", suffix: "人", color: "#1677ff", trend: "+12.5%" },
  { title: "本月营收", value: 245000, prefix: "¥", suffix: "", color: "#52c41a", trend: "+8.9%" },
  { title: "订单总数", value: 2100, prefix: "", suffix: "单", color: "#faad14", trend: "+7.7%" },
  { title: "转化率", value: 30.9, prefix: "", suffix: "%", color: "#eb2f96", trend: "+1.2%" },
];
