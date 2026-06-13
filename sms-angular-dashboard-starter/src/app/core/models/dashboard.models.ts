export interface NavItem {
  label: string;
  icon: string;
  route: string;
  active?: boolean;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export interface StatCard {
  title: string;
  value: string;
  helper: string;
  icon: string;
  iconClass: string;
  helperClass?: string;
}

export interface QueueItem {
  student: string;
  task: string;
  status: string;
  statusClass: string;
  avatarClass: string;
  avatarIcon: string;
}

export interface ProgressItem {
  label: string;
  count: string;
  percent: number;
  barClass: string;
  dotClass: string;
}

export interface QuickAction {
  label: string;
  icon: string;
  iconClass: string;
}
