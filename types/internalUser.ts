export type InternalRole =
  | "Admin"
  | "Trưởng phòng vật tư"
  | "Kế hoạch vật tư"
  | "Ban giám đốc"
  | "Chỉ xem";

export type InternalStatus = "Hoạt động" | "Tạm khóa";

export interface InternalUser {
  id: string;
  fullName: string;
  email: string;
  password: string;
  role: string;
  department: string;
  status: string;
  createdAt: string;
  /** @deprecated use fullName */
  name?: string;
}
