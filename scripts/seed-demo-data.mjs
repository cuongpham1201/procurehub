import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Pool } = pg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const DEMO_SEED_KEY = "procurehub-demo-seed-v1";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) continue;
    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.join(rootDir, ".env.local"));
loadEnvFile(path.join(rootDir, ".env"));

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not configured. Set it in the environment or .env.local.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30_000,
});

function withDemoMeta(record) {
  return {
    ...record,
    _isDemo: true,
    _demoSeed: DEMO_SEED_KEY,
  };
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function toIso(dateOnly, hour = "08:00:00") {
  return `${dateOnly}T${hour}.000Z`;
}

function money(value) {
  return Number(value);
}

const TODAY = "2026-05-14";

const categories = [
  {
    id: "DEMO-CAT-001",
    code: "DEMO-CAT-PALLET",
    name: "Pallet và vật tư kho",
    description: "Nhóm mua sắm pallet, kệ kho và vật tư phục vụ lưu kho thành phẩm.",
    status: "Hoạt động",
    createdAt: toIso("2026-04-01"),
  },
  {
    id: "DEMO-CAT-002",
    code: "DEMO-CAT-LOG",
    name: "Logistics và vận tải",
    description: "Dịch vụ vận tải nội địa, kho phụ trợ và điều phối chuỗi cung ứng.",
    status: "Hoạt động",
    createdAt: toIso("2026-04-01", "08:10:00"),
  },
  {
    id: "DEMO-CAT-003",
    code: "DEMO-CAT-UNIFORM",
    name: "Đồng phục và bảo hộ lao động",
    description: "Đồng phục văn phòng, đồng phục xưởng và trang bị bảo hộ lao động.",
    status: "Hoạt động",
    createdAt: toIso("2026-04-01", "08:20:00"),
  },
  {
    id: "DEMO-CAT-004",
    code: "DEMO-CAT-MRO",
    name: "Bảo trì và nâng hạ",
    description: "Bảo trì xe nâng, thiết bị nâng hạ và vật tư MRO cho nhà máy.",
    status: "Hoạt động",
    createdAt: toIso("2026-04-01", "08:30:00"),
  },
  {
    id: "DEMO-CAT-005",
    code: "DEMO-CAT-IT",
    name: "Thiết bị CNTT",
    description: "Máy tính, thiết bị mạng, máy in và phụ kiện công nghệ thông tin.",
    status: "Hoạt động",
    createdAt: toIso("2026-04-01", "08:40:00"),
  },
  {
    id: "DEMO-CAT-006",
    code: "DEMO-CAT-PKG",
    name: "Nguyên vật liệu đóng gói",
    description: "Bao bì, màng co, carton, dây đai và vật tư đóng gói thành phẩm.",
    status: "Hoạt động",
    createdAt: toIso("2026-04-01", "08:50:00"),
  },
  {
    id: "DEMO-CAT-007",
    code: "DEMO-CAT-SVC",
    name: "Dịch vụ vệ sinh và phụ trợ",
    description: "Vệ sinh nhà máy và các dịch vụ phụ trợ phục vụ vận hành.",
    status: "Hoạt động",
    createdAt: toIso("2026-04-01", "09:00:00"),
  },
];

const materials = [
  {
    id: "DEMO-MAT-001",
    categoryId: "DEMO-CAT-001",
    categoryName: "Pallet và vật tư kho",
    materialCode: "DEMO-MAT-PALLET-1100",
    materialName: "Pallet nhựa 1100x1100",
    specification: "Tải trọng động 1.500kg, 4 hướng nâng",
    unit: "Cai",
    description: "Sử dụng cho kho thành phẩm và kho bao bì.",
    status: "Hoạt động",
    createdAt: toIso("2026-04-03"),
  },
  {
    id: "DEMO-MAT-002",
    categoryId: "DEMO-CAT-001",
    categoryName: "Pallet và vật tư kho",
    materialCode: "DEMO-MAT-PALLET-1300",
    materialName: "Pallet nhựa 1200x1000",
    specification: "Tải trọng tĩnh 4.000kg, có thể lồng thép",
    unit: "Cai",
    description: "Sử dụng cho kho nguyên liệu và khu xuất hàng.",
    status: "Hoạt động",
    createdAt: toIso("2026-04-03", "08:10:00"),
  },
  {
    id: "DEMO-MAT-003",
    categoryId: "DEMO-CAT-002",
    categoryName: "Logistics và vận tải",
    materialCode: "DEMO-MAT-LOG-TRUCK",
    materialName: "Dịch vụ vận tải xe tải 8-15 tấn",
    specification: "Tuyến Hạ Long - Hà Nội - Hải Phòng",
    unit: "Chuyen",
    description: "Vận chuyển hàng thành phẩm và vật tư theo kế hoạch tháng.",
    status: "Hoạt động",
    createdAt: toIso("2026-04-03", "08:20:00"),
  },
  {
    id: "DEMO-MAT-004",
    categoryId: "DEMO-CAT-003",
    categoryName: "Đồng phục và bảo hộ lao động",
    materialCode: "DEMO-MAT-UNI-VP",
    materialName: "Đồng phục văn phòng",
    specification: "Áo sơ mi dài tay, quần âu, chất liệu thoáng mát",
    unit: "Bo",
    description: "May đo theo size chuẩn nam nữ.",
    status: "Hoạt động",
    createdAt: toIso("2026-04-03", "08:30:00"),
  },
  {
    id: "DEMO-MAT-005",
    categoryId: "DEMO-CAT-003",
    categoryName: "Đồng phục và bảo hộ lao động",
    materialCode: "DEMO-MAT-UNI-XUONG",
    materialName: "Đồng phục nhà xưởng",
    specification: "Kaki 65/35, phản quang, thêu logo",
    unit: "Bo",
    description: "Cho khối sản xuất và bảo trì.",
    status: "Hoạt động",
    createdAt: toIso("2026-04-03", "08:40:00"),
  },
  {
    id: "DEMO-MAT-006",
    categoryId: "DEMO-CAT-004",
    categoryName: "Bảo trì và nâng hạ",
    materialCode: "DEMO-MAT-FL-MAINT",
    materialName: "Gói bảo trì xe nâng",
    specification: "Bảo trì định kỳ, vật tư tiêu hao và thay thế phụ tùng",
    unit: "Goi",
    description: "Áp dụng cho xe nâng điện và xe nâng dầu.",
    status: "Hoạt động",
    createdAt: toIso("2026-04-03", "08:50:00"),
  },
  {
    id: "DEMO-MAT-007",
    categoryId: "DEMO-CAT-005",
    categoryName: "Thiết bị CNTT",
    materialCode: "DEMO-MAT-IT-LAPTOP",
    materialName: "Laptop doanh nghiệp",
    specification: "Core i7, RAM 16GB, SSD 512GB",
    unit: "Bo",
    description: "Cho phòng mua hàng, kho và ban giám đốc.",
    status: "Hoạt động",
    createdAt: toIso("2026-04-03", "09:00:00"),
  },
  {
    id: "DEMO-MAT-008",
    categoryId: "DEMO-CAT-005",
    categoryName: "Thiết bị CNTT",
    materialCode: "DEMO-MAT-IT-SWITCH",
    materialName: "Switch PoE 24 port",
    specification: "Managed Layer 2, có uplink SFP",
    unit: "Cai",
    description: "Cho camera, access point Wi-Fi và mở rộng mạng nội bộ.",
    status: "Hoạt động",
    createdAt: toIso("2026-04-03", "09:10:00"),
  },
  {
    id: "DEMO-MAT-009",
    categoryId: "DEMO-CAT-006",
    categoryName: "Nguyên vật liệu đóng gói",
    materialCode: "DEMO-MAT-PKG-STRETCH",
    materialName: "Màng PE quấn pallet",
    specification: "17 micron, khổ 500mm",
    unit: "Kg",
    description: "Phục vụ đóng gói thành phẩm xuất kho.",
    status: "Hoạt động",
    createdAt: toIso("2026-04-03", "09:20:00"),
  },
  {
    id: "DEMO-MAT-010",
    categoryId: "DEMO-CAT-006",
    categoryName: "Nguyên vật liệu đóng gói",
    materialCode: "DEMO-MAT-PKG-CARTON",
    materialName: "Thùng carton 24 lon",
    specification: "5 lớp, in 2 màu, tải trọng 15kg",
    unit: "Cai",
    description: "Dùng cho đóng gói bia lon 330ml.",
    status: "Hoạt động",
    createdAt: toIso("2026-04-03", "09:30:00"),
  },
  {
    id: "DEMO-MAT-011",
    categoryId: "DEMO-CAT-007",
    categoryName: "Dịch vụ vệ sinh và phụ trợ",
    materialCode: "DEMO-MAT-SVC-CLEAN",
    materialName: "Dịch vụ vệ sinh nhà máy",
    specification: "Vệ sinh xưởng, văn phòng, nhà ăn và khu vệ sinh",
    unit: "Goi",
    description: "Bao gồm nhân sự, hóa chất và thiết bị vệ sinh.",
    status: "Hoạt động",
    createdAt: toIso("2026-04-03", "09:40:00"),
  },
];

const internalUsers = [
  {
    id: "DEMO-INT-ADMIN-001",
    fullName: "Trần Quốc Bảo",
    name: "Trần Quốc Bảo",
    email: "demo.admin@procurehub.local",
    password: "demo123",
    role: "Admin",
    department: "Quản trị hệ thống",
    status: "Hoạt động",
    createdAt: toIso("2026-04-05"),
  },
  {
    id: "DEMO-INT-PROC-001",
    fullName: "Nguyễn Thị Mai",
    name: "Nguyễn Thị Mai",
    email: "demo.procurement1@procurehub.local",
    password: "demo123",
    role: "Trưởng phòng vật tư",
    department: "Phòng kế hoạch vật tư",
    status: "Hoạt động",
    createdAt: toIso("2026-04-05", "08:10:00"),
  },
  {
    id: "DEMO-INT-PROC-002",
    fullName: "Hoàng Văn Quang",
    name: "Hoàng Văn Quang",
    email: "demo.procurement2@procurehub.local",
    password: "demo123",
    role: "Kế hoạch vật tư",
    department: "Phòng kế hoạch vật tư",
    status: "Hoạt động",
    createdAt: toIso("2026-04-05", "08:20:00"),
  },
  {
    id: "DEMO-INT-MGR-001",
    fullName: "Lê Thu Hương",
    name: "Lê Thu Hương",
    email: "demo.approver@procurehub.local",
    password: "demo123",
    role: "Ban giám đốc",
    department: "Ban giám đốc",
    status: "Hoạt động",
    createdAt: toIso("2026-04-05", "08:30:00"),
  },
  {
    id: "DEMO-INT-VIEW-001",
    fullName: "Phạm Thị Trang",
    name: "Phạm Thị Trang",
    email: "demo.viewer@procurehub.local",
    password: "demo123",
    role: "Chỉ xem",
    department: "Van phong dieu hanh",
    status: "Hoạt động",
    createdAt: toIso("2026-04-05", "08:40:00"),
  },
];

const suppliers = [
  {
    id: "DEMO-SUP-001",
    companyName: "Công ty Cổ phần Pallet Nhựa Đông Dương",
    taxCode: "0201988001",
    contactName: "Trần Đức Thắng",
    email: "demo.pallet@dongduong.vn",
    phone: "0903111001",
    password: "demo123",
    profileCompleted: true,
    status: "Đã duyệt",
    createdAt: toIso("2026-04-10"),
    address: "Lô CN2, KCN Nam Cầu Kiền, Thủy Nguyên",
    province: "Hải Phòng",
    website: "https://demo-dongduong.example.com",
    businessDescription: "Sản xuất pallet nhựa, pallet lót sàn và vật tư lưu kho cho nhà máy FMCG.",
    categories: ["Pallet và vật tư kho", "Nguyên vật liệu đóng gói"],
    hotline: "02253888001",
    rfqEmail: "rfq@demo-dongduong.example.com",
    quotationContact: "Trần Đức Thắng - Trưởng phòng kinh doanh dự án",
  },
  {
    id: "DEMO-SUP-002",
    companyName: "Công ty TNHH Logistics Bắc Nam",
    taxCode: "0102988002",
    contactName: "Vũ Minh Tiến",
    email: "demo.logistics@bacnam.vn",
    phone: "0903111002",
    password: "demo123",
    profileCompleted: true,
    status: "Đã duyệt",
    createdAt: toIso("2026-04-11"),
    address: "Km12 Quoc lo 5, An Duong",
    province: "Hai Phong",
    website: "https://demo-bacnam.example.com",
    businessDescription: "Vận tải nội địa, phân phối hàng FMCG và điều độ xe tải khu vực miền Bắc.",
    categories: ["Logistics và vận tải", "Dịch vụ vệ sinh và phụ trợ"],
    hotline: "02253888002",
    rfqEmail: "rfq@demo-bacnam.example.com",
    quotationContact: "Vũ Minh Tiến - Giám đốc kinh doanh",
  },
  {
    id: "DEMO-SUP-003",
    companyName: "Công ty Cổ phần Đồng phục Sao Vàng",
    taxCode: "0313988003",
    contactName: "Nguyễn Hà Linh",
    email: "demo.uniform@saovang.vn",
    phone: "0903111003",
    password: "demo123",
    profileCompleted: true,
    status: "Đã duyệt",
    createdAt: toIso("2026-04-12"),
    address: "Duong so 8, KCN Tan Binh",
    province: "TP. Ho Chi Minh",
    website: "https://demo-saovang.example.com",
    businessDescription: "Thiết kế, may đồng phục doanh nghiệp và quần áo bảo hộ lao động.",
    categories: ["Đồng phục và bảo hộ lao động"],
    hotline: "02838880003",
    rfqEmail: "rfq@demo-saovang.example.com",
    quotationContact: "Nguyễn Hà Linh - Key Account Manager",
  },
  {
    id: "DEMO-SUP-004",
    companyName: "Công ty TNHH Cơ điện Hạ Long",
    taxCode: "5701888999",
    contactName: "Phạm Quốc Huy",
    email: "demo.codien@halong.vn",
    phone: "0903111004",
    password: "demo123",
    profileCompleted: true,
    status: "Đã duyệt",
    createdAt: toIso("2026-04-13"),
    address: "Khu 4, phường Việt Hưng, Hạ Long",
    province: "Quảng Ninh",
    website: "https://demo-codienhalong.example.com",
    businessDescription: "Bảo trì cơ điện, sửa chữa máy móc và thiết bị nâng hạ công nghiệp.",
    categories: ["Bảo trì và nâng hạ", "Dịch vụ vệ sinh và phụ trợ"],
    hotline: "02033888004",
    rfqEmail: "rfq@demo-codienhalong.example.com",
    quotationContact: "Phạm Quốc Huy - Giám đốc kỹ thuật",
  },
  {
    id: "DEMO-SUP-005",
    companyName: "Công ty Cổ phần Kho vận Đông Bắc",
    taxCode: "5702988005",
    contactName: "Lê Thành Sơn",
    email: "demo.khovan@dongbac.vn",
    phone: "0903111005",
    password: "demo123",
    profileCompleted: true,
    status: "Đã duyệt",
    createdAt: toIso("2026-04-14"),
    address: "Cụm công nghiệp Hà Khánh, Hạ Long",
    province: "Quảng Ninh",
    website: "https://demo-dongbac.example.com",
    businessDescription: "Cho thuê kho, vận hành kho trung chuyển và dịch vụ xếp dỡ hàng hóa.",
    categories: ["Logistics và vận tải", "Pallet và vật tư kho"],
    hotline: "02033888005",
    rfqEmail: "rfq@demo-dongbac.example.com",
    quotationContact: "Lê Thành Sơn - Trưởng bộ phận kho vận",
  },
  {
    id: "DEMO-SUP-006",
    companyName: "Công ty TNHH Giải pháp CNTT Hải Phòng",
    taxCode: "0203988006",
    contactName: "Đỗ Quang Hiệp",
    email: "demo.it@haiphong.vn",
    phone: "0903111006",
    password: "demo123",
    profileCompleted: true,
    status: "Đã duyệt",
    createdAt: toIso("2026-04-15"),
    address: "So 18 Le Hong Phong, Ngo Quyen",
    province: "Hải Phòng",
    website: "https://demo-hpit.example.com",
    businessDescription: "Cung cấp laptop, switch, camera, Wi-Fi và dịch vụ triển khai hạ tầng CNTT.",
    categories: ["Thiết bị CNTT"],
    hotline: "02253888006",
    rfqEmail: "rfq@demo-hpit.example.com",
    quotationContact: "Đỗ Quang Hiệp - Trưởng phòng dự án",
  },
  {
    id: "DEMO-SUP-007",
    companyName: "Công ty Cổ phần Bao bì Á Châu",
    taxCode: "0305566778",
    contactName: "Trần Thu Hà",
    email: "demo.packaging@achau.vn",
    phone: "0903111007",
    password: "demo123",
    profileCompleted: true,
    status: "Đã duyệt",
    createdAt: toIso("2026-04-16"),
    address: "Duong so 6, KCN VSIP, Thuan An",
    province: "Bình Dương",
    website: "https://demo-achau.example.com",
    businessDescription: "Sản xuất carton, màng PE, màng co và vật tư bao bì cho ngành đồ uống.",
    categories: ["Nguyên vật liệu đóng gói"],
    hotline: "02743888007",
    rfqEmail: "rfq@demo-achau.example.com",
    quotationContact: "Trần Thu Hà - Key Account Manager",
  },
  {
    id: "DEMO-SUP-008",
    companyName: "Công ty Dịch vụ Công nghiệp Sao Bắc",
    taxCode: "0106677889",
    contactName: "Lê Hoàng Nam",
    email: "demo.cleaning@saobac.vn",
    phone: "0903111008",
    password: "demo123",
    profileCompleted: true,
    status: "Đã duyệt",
    createdAt: toIso("2026-04-17"),
    address: "Tang 5 toa Song Hong, Long Bien",
    province: "Ha Noi",
    website: "https://demo-saobac.example.com",
    businessDescription: "Vệ sinh công nghiệp, tạp vụ nhà máy, quản lý chất thải và vật tư vệ sinh.",
    categories: ["Dịch vụ vệ sinh và phụ trợ"],
    hotline: "02438880008",
    rfqEmail: "rfq@demo-saobac.example.com",
    quotationContact: "Lê Hoàng Nam - Trưởng bộ phận dự án",
  },
  {
    id: "DEMO-SUP-009",
    companyName: "Công ty Cổ phần Kỹ thuật Nâng hạ 886",
    taxCode: "0109988009",
    contactName: "Bùi Đình Long",
    email: "demo.nangha@886.vn",
    phone: "0903111009",
    password: "demo123",
    profileCompleted: true,
    status: "Tạm khóa",
    createdAt: toIso("2026-04-18"),
    address: "Đường 5 mới, Từ Sơn",
    province: "Bắc Ninh",
    website: "https://demo-886.example.com",
    businessDescription: "Sửa chữa xe nâng, cung cấp phụ tùng và xe nâng đã qua sử dụng.",
    categories: ["Bảo trì và nâng hạ"],
    hotline: "02223888009",
    rfqEmail: "rfq@demo-886.example.com",
    quotationContact: "Bùi Đình Long - Trưởng nhóm dịch vụ",
  },
  {
    id: "DEMO-SUP-010",
    companyName: "Công ty TNHH May Bảo hộ Phúc An",
    taxCode: "0314988010",
    contactName: "Tạ Kim Oanh",
    email: "demo.phucan@uniform.vn",
    phone: "0903111010",
    password: "demo123",
    profileCompleted: true,
    status: "Đã duyệt",
    createdAt: toIso("2026-04-19"),
    address: "KCN Vinh Loc, Binh Tan",
    province: "TP. Ho Chi Minh",
    website: "https://demo-phucan.example.com",
    businessDescription: "May đồng phục, áo khoác, bảo hộ lao động và in thêu nhận diện thương hiệu.",
    categories: ["Đồng phục và bảo hộ lao động", "Nguyên vật liệu đóng gói"],
    hotline: "0283888010",
    rfqEmail: "rfq@demo-phucan.example.com",
    quotationContact: "Tạ Kim Oanh - Quản lý bán hàng",
  },
  {
    id: "DEMO-SUP-011",
    companyName: "Công ty TNHH Vật tư Tổng hợp Minh Phát",
    taxCode: "0207788990",
    contactName: "Đỗ Thị Lan",
    email: "demo.minhphat@supply.vn",
    phone: "0903111011",
    password: "demo123",
    profileCompleted: true,
    status: "Chờ xét duyệt",
    createdAt: toIso("2026-04-20"),
    address: "So 88 Le Hong Phong, Ngo Quyen",
    province: "Hải Phòng",
    website: "https://demo-minhphat.example.com",
    businessDescription: "Thương mại vật tư tổng hợp, công cụ dụng cụ và đồ bảo hộ lao động.",
    categories: ["Đồng phục và bảo hộ lao động", "Bảo trì và nâng hạ"],
    hotline: "02253888011",
    rfqEmail: "rfq@demo-minhphat.example.com",
    quotationContact: "Đỗ Thị Lan - Kinh doanh dự án",
  },
  {
    id: "DEMO-SUP-012",
    companyName: "Công ty TNHH Smart Office Việt",
    taxCode: "0315988012",
    contactName: "Nguyễn Tuấn Phong",
    email: "demo.smartoffice@viet.vn",
    phone: "0903111012",
    password: "demo123",
    profileCompleted: true,
    status: "Từ chối",
    createdAt: toIso("2026-04-21"),
    address: "Toa nha M-Hub, Quan 3",
    province: "TP. Ho Chi Minh",
    website: "https://demo-smartoffice.example.com",
    businessDescription: "Máy in, thiết bị văn phòng và nội thất văn phòng tiêu chuẩn.",
    categories: ["Thiết bị CNTT"],
    hotline: "0283888012",
    rfqEmail: "rfq@demo-smartoffice.example.com",
    quotationContact: "Nguyễn Tuấn Phong - Chuyên viên dự án",
  },
];

const tenders = [
  {
    id: "DEMO-TDR-001",
    code: "DEMO-GT-2026-001",
    title: "Mua pallet nhựa cho kho thành phẩm và kho bao bì",
    category: "Pallet và vật tư kho",
    status: "Nháp",
    deadline: addDays(TODAY, 21),
    estimatedValue: money(540_000_000),
    description: "Mua bổ sung pallet nhựa tải trọng 1,5 tấn cho kho thành phẩm, đồng bộ quy cách sử dụng xe nâng và line quấn màng.",
    deliveryLocation: "Kho thành phẩm - Nhà máy Bia Hạ Long",
    deliveryTime: "Giao 2 đợt trong 20 ngày sau khi phát hành đơn đặt hàng",
    paymentTerms: "Thanh toán trong 30 ngày sau nghiệm thu từng đợt giao",
    documentRequirements: [
      "Bao gia theo tung quy cach pallet",
      "Ban test tai trong va chong truot",
      "Cam ket bao hanh nut vo toi thieu 12 thang",
    ],
    items: [
      {
        id: "DEMO-TDR-001-ITEM-1",
        materialId: "DEMO-MAT-001",
        materialCode: "DEMO-MAT-PALLET-1100",
        itemName: "Pallet nhua 1100x1100",
        specification: "Tai trong dong 1.500kg, 4 huong nang, mat luoi",
        quantity: 300,
        unit: "Cai",
        note: "Su dung cho kho thanh pham dong lon",
      },
      {
        id: "DEMO-TDR-001-ITEM-2",
        materialId: "DEMO-MAT-002",
        materialCode: "DEMO-MAT-PALLET-1300",
        itemName: "Pallet nhua 1200x1000",
        specification: "Tai trong tinh 4.000kg, co the long thep",
        quantity: 150,
        unit: "Cai",
        note: "Su dung cho kho nguyen lieu va khu staging",
      },
    ],
    createdAt: toIso("2026-05-01"),
  },
  {
    id: "DEMO-TDR-002",
    code: "DEMO-GT-2026-002",
    title: "Dịch vụ vận tải nội địa từ nhà máy đến kho trung chuyển miền Bắc",
    category: "Logistics và vận tải",
    status: "Nháp",
    deadline: addDays(TODAY, 14),
    estimatedValue: money(1_150_000_000),
    description: "Lua chon don vi van tai noi dia phuc vu chuyen bia lon va bia chai tu Ha Long di Ha Noi, Hai Phong va Bac Ninh.",
    deliveryLocation: "Nha may Bia Ha Long - giao cac kho trung chuyen mien Bac",
    deliveryTime: "Van hanh tu 01/06/2026 den 30/09/2026",
    paymentTerms: "Doi soat hang thang, thanh toan trong 15 ngay",
    documentRequirements: [
      "Bang gia theo tuyen va tai trong",
      "Thong tin doi xe, GPS va bao hiem hang hoa",
      "Cam ket SLA giao hang dung hen >= 98%",
    ],
    items: [
      {
        id: "DEMO-TDR-002-ITEM-1",
        materialId: "DEMO-MAT-003",
        materialCode: "DEMO-MAT-LOG-TRUCK",
        itemName: "Van tai xe tai 8-15 tan",
        specification: "Tuyen Ha Long - Ha Noi - Hai Phong - Bac Ninh",
        quantity: 180,
        unit: "Chuyen",
        note: "Bao gom return proof of delivery",
      },
    ],
    createdAt: toIso("2026-05-02"),
  },
  {
    id: "DEMO-TDR-003",
    code: "DEMO-GT-2026-003",
    title: "Mua đồng phục nhân viên văn phòng và nhà xưởng năm 2026",
    category: "Đồng phục và bảo hộ lao động",
    status: "Đang mở",
    deadline: addDays(TODAY, 12),
    estimatedValue: money(420_000_000),
    description: "May moi dong phuc cho khoi van phong, khoi san xuat va bo phan bao tri, dong nhat mau nhan dien Bia Ha Long.",
    deliveryLocation: "Phong Hanh chinh - Nha may Bia Ha Long",
    deliveryTime: "Giao size set mau trong 10 ngay, giao hang chinh trong 35 ngay",
    paymentTerms: "Dat coc 20%, thanh toan 80% sau nghiem thu",
    documentRequirements: [
      "Bang size va bang dinh muc vai",
      "Mau vai, mau logo theu/in",
      "Tien do giao hang chi tiet theo dot",
    ],
    items: [
      {
        id: "DEMO-TDR-003-ITEM-1",
        materialId: "DEMO-MAT-004",
        materialCode: "DEMO-MAT-UNI-VP",
        itemName: "Dong phuc van phong",
        specification: "Ao so mi dai tay, quan/vay cong so, co theu logo",
        quantity: 180,
        unit: "Bo",
        note: "Mau xanh navy - vang nhat dien",
      },
      {
        id: "DEMO-TDR-003-ITEM-2",
        materialId: "DEMO-MAT-005",
        materialCode: "DEMO-MAT-UNI-XUONG",
        itemName: "Dong phuc nha xuong",
        specification: "Vai kaki 65/35, co phan quang, chiu mai mon",
        quantity: 220,
        unit: "Bo",
        note: "Theu ten bo phan va so tu dong",
      },
    ],
    createdAt: toIso("2026-05-03"),
  },
  {
    id: "DEMO-TDR-004",
    code: "DEMO-GT-2026-004",
    title: "Bảo trì tổng thể xe nâng điện và xe nâng dầu quý III/2026",
    category: "Bảo trì và nâng hạ",
    status: "Đang mở",
    deadline: addDays(TODAY, 9),
    estimatedValue: money(680_000_000),
    description: "Bao tri tong the 12 xe nang gom thiet bi dien, he thong thuy luc, vo xe, phanh va thay the phu tung tieu hao.",
    deliveryLocation: "Xuong bao tri co dien - Nha may Bia Ha Long",
    deliveryTime: "Thuc hien trong 45 ngay sau ky hop dong",
    paymentTerms: "Thanh toan 30 ngay sau nghiem thu tung xe",
    documentRequirements: [
      "Danh sach phu tung chinh hang hoac tuong duong",
      "Ke hoach dung xe va phan bo ky thuat vien",
      "Cam ket bao hanh toi thieu 6 thang sau sua chua",
    ],
    items: [
      {
        id: "DEMO-TDR-004-ITEM-1",
        materialId: "DEMO-MAT-006",
        materialCode: "DEMO-MAT-FL-MAINT",
        itemName: "Bao tri xe nang dien 2.5 tan",
        specification: "Kiem tra he thong dien, thay dau thuy luc, loc va phanh",
        quantity: 7,
        unit: "Xe",
        note: "Toyota va Komatsu",
      },
      {
        id: "DEMO-TDR-004-ITEM-2",
        materialId: "DEMO-MAT-006",
        materialCode: "DEMO-MAT-FL-MAINT",
        itemName: "Bao tri xe nang dau 3.0 tan",
        specification: "Overhaul nhe, thay phu tung tieu hao va canh chinh mast",
        quantity: 5,
        unit: "Xe",
        note: "Doosan va Hangcha",
      },
    ],
    createdAt: toIso("2026-05-04"),
  },
  {
    id: "DEMO-TDR-005",
    code: "DEMO-GT-2026-005",
    title: "Thuê kho phụ trợ 1.500 m2 phục vụ tồn kho mùa cao điểm",
    category: "Logistics và vận tải",
    status: "Đang đánh giá",
    deadline: addDays(TODAY, -5),
    estimatedValue: money(960_000_000),
    description: "Tim kho phu tro tai khu vuc Ha Long/Cam Pha de giam ap luc ton kho mua he, co yeu cau PCCC va xe container vao duoc.",
    deliveryLocation: "Ban giao kho tai Quang Ninh",
    deliveryTime: "San sang khai thac tu 01/06/2026",
    paymentTerms: "Thanh toan hang thang vao ngay 15 thang tiep theo",
    documentRequirements: [
      "Ban ve mat bang va giay to PCCC",
      "Bao gia theo m2/thang va phi xu ly xep do",
      "Hinh anh kho, ram doc, khu tap ket xe",
    ],
    items: [
      {
        id: "DEMO-TDR-005-ITEM-1",
        materialId: "DEMO-MAT-003",
        materialCode: "DEMO-MAT-LOG-TRUCK",
        itemName: "Dien tich kho khô",
        specification: "Kho sach, cao thong thuy >= 8m, san phang",
        quantity: 1500,
        unit: "m2",
        note: "Co toi thieu 6 cua xuat nhap",
      },
      {
        id: "DEMO-TDR-005-ITEM-2",
        materialId: "DEMO-MAT-001",
        materialCode: "DEMO-MAT-PALLET-1100",
        itemName: "Dich vu xep do, luu pallet va bao quan",
        specification: "Bao gom nhan cong, xe nang va theo doi ton kho",
        quantity: 4,
        unit: "Thang",
        note: "Tu 06/2026 den 09/2026",
      },
    ],
    createdAt: toIso("2026-05-05"),
  },
  {
    id: "DEMO-TDR-006",
    code: "DEMO-GT-2026-006",
    title: "Mua thiết bị CNTT cho kho vận và khối điều hành",
    category: "Thiết bị CNTT",
    status: "Đang đánh giá",
    deadline: addDays(TODAY, -2),
    estimatedValue: money(780_000_000),
    description: "Mua laptop, switch PoE, wifi access point va may in ma vach de nang cap van hanh kho va van phong dieu hanh.",
    deliveryLocation: "Phong CNTT - Nha may Bia Ha Long",
    deliveryTime: "Giao dong loat trong 21 ngay sau ky hop dong",
    paymentTerms: "Thanh toan 100% sau nghiem thu va ban giao",
    documentRequirements: [
      "CO/CQ va serial thiet bi",
      "Phuong an cai dat, migration du lieu va onsite support",
      "Bao hanh onsite toi thieu 24 thang",
    ],
    items: [
      {
        id: "DEMO-TDR-006-ITEM-1",
        materialId: "DEMO-MAT-007",
        materialCode: "DEMO-MAT-IT-LAPTOP",
        itemName: "Laptop doanh nghiep 14 inch",
        specification: "Core i7, RAM 16GB, SSD 512GB, Win Pro",
        quantity: 12,
        unit: "Bo",
        note: "Dung cho khoi mua hang, kho va BGD",
      },
      {
        id: "DEMO-TDR-006-ITEM-2",
        materialId: "DEMO-MAT-008",
        materialCode: "DEMO-MAT-IT-SWITCH",
        itemName: "Switch PoE 24 port",
        specification: "Managed Layer 2, co uplink SFP",
        quantity: 4,
        unit: "Cai",
        note: "Cap nguon camera va AP wifi",
      },
      {
        id: "DEMO-TDR-006-ITEM-3",
        materialId: "DEMO-MAT-008",
        materialCode: "DEMO-MAT-IT-SWITCH",
        itemName: "May in ma vach cong nghiep",
        specification: "Do phan giai 300dpi, in decal cuon lien tuc",
        quantity: 3,
        unit: "Cai",
        note: "Tich hop WMS noi bo",
      },
    ],
    createdAt: toIso("2026-05-06"),
  },
  {
    id: "DEMO-TDR-007",
    code: "DEMO-GT-2026-007",
    title: "Mua nguyên vật liệu đóng gói cho chiến dịch sản xuất hè 2026",
    category: "Nguyên vật liệu đóng gói",
    status: "Đã có kết quả",
    deadline: addDays(TODAY, -14),
    estimatedValue: money(2_350_000_000),
    description: "Cung cap mang PE quấn pallet, thung carton 24 lon va day dai PET cho dong goi thanh pham mua cao diem.",
    deliveryLocation: "Kho bao bi - Nha may Bia Ha Long",
    deliveryTime: "Giao 3 dot trong thang 5 va 6/2026",
    paymentTerms: "Thanh toan 30 ngay sau tung dot nghiem thu",
    documentRequirements: [
      "Ket qua test do ben va do dai",
      "Mau in carton va quy cach dong goi",
      "Lich giao hang theo tuan",
    ],
    items: [
      {
        id: "DEMO-TDR-007-ITEM-1",
        materialId: "DEMO-MAT-009",
        materialCode: "DEMO-MAT-PKG-STRETCH",
        itemName: "Mang PE quấn pallet",
        specification: "17 micron, kho 500mm, do dai on dinh",
        quantity: 4800,
        unit: "Kg",
        note: "Dung cho line dong thung va xuat kho",
      },
      {
        id: "DEMO-TDR-007-ITEM-2",
        materialId: "DEMO-MAT-010",
        materialCode: "DEMO-MAT-PKG-CARTON",
        itemName: "Thung carton 24 lon",
        specification: "5 lop, in 2 mau, tai trong 15kg",
        quantity: 160000,
        unit: "Cai",
        note: "Dung cho bia lon 330ml",
      },
      {
        id: "DEMO-TDR-007-ITEM-3",
        materialId: "DEMO-MAT-001",
        materialCode: "DEMO-MAT-PALLET-1100",
        itemName: "Day dai PET dong pallet",
        specification: "Ban 15.5mm, luc keo dut >= 450kg",
        quantity: 1200,
        unit: "Cuon",
        note: "Dung cho line quấn pallet tu dong",
      },
    ],
    createdAt: toIso("2026-05-07"),
  },
  {
    id: "DEMO-TDR-008",
    code: "DEMO-GT-2026-008",
    title: "Dịch vụ vệ sinh nhà máy và khu văn phòng 6 tháng cuối năm",
    category: "Dịch vụ vệ sinh và phụ trợ",
    status: "Đã hủy",
    deadline: addDays(TODAY, 6),
    estimatedValue: money(510_000_000),
    description: "Goi dich vu ve sinh nha xuong, van phong, nha an va khu cong cong. Da tam dung de dieu chinh pham vi.",
    deliveryLocation: "Toan bo khuon vien Nha may Bia Ha Long",
    deliveryTime: "Du kien ap dung tu 01/07/2026",
    paymentTerms: "Thanh toan theo thang sau doi soat khoi luong",
    documentRequirements: [
      "Bang nhan su theo ca",
      "Danh muc hoa chat va SDS",
      "Phuong an ve sinh dinh ky khu co nguy co truon truot",
    ],
    items: [
      {
        id: "DEMO-TDR-008-ITEM-1",
        materialId: "DEMO-MAT-011",
        materialCode: "DEMO-MAT-SVC-CLEAN",
        itemName: "Ve sinh nha xuong va hanh lang san xuat",
        specification: "3 ca/ngay, co may hut bui cong nghiep va may cha san",
        quantity: 6,
        unit: "Thang",
        note: "Tam hoan de ra soat lai pham vi",
      },
      {
        id: "DEMO-TDR-008-ITEM-2",
        materialId: "DEMO-MAT-011",
        materialCode: "DEMO-MAT-SVC-CLEAN",
        itemName: "Ve sinh van phong, nha an va toilet",
        specification: "Theo checklist hang ngay, bo sung vat tu tieu hao",
        quantity: 6,
        unit: "Thang",
        note: "Tam hoan de cap nhat yeu cau KPI",
      },
    ],
    createdAt: toIso("2026-05-08"),
  },
];

function getTender(tenderId) {
  const tender = tenders.find((item) => item.id === tenderId);
  if (!tender) {
    throw new Error(`Missing demo tender: ${tenderId}`);
  }
  return tender;
}

function getSupplier(supplierId) {
  const supplier = suppliers.find((item) => item.id === supplierId);
  if (!supplier) {
    throw new Error(`Missing demo supplier: ${supplierId}`);
  }
  return supplier;
}

function makeBid({
  id,
  bidCode,
  tenderId,
  supplierId,
  status,
  submittedAt,
  unitPrices,
  deliveryTime,
  paymentTerms,
  warrantyPolicy,
  note,
  itemMeta = [],
}) {
  const tender = getTender(tenderId);
  const supplier = getSupplier(supplierId);
  const items = tender.items.map((item, index) => {
    const unitPrice = unitPrices[index] ?? 0;
    return {
      id: `${id}-ITEM-${index + 1}`,
      tenderItemId: item.id,
      itemName: item.itemName,
      specification: item.specification,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice,
      amount: Number((item.quantity * unitPrice).toFixed(2)),
      brand: itemMeta[index]?.brand,
      origin: itemMeta[index]?.origin,
      deliveryTime: itemMeta[index]?.deliveryTime,
      note: itemMeta[index]?.note,
    };
  });

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  return {
    id,
    bidCode,
    tenderId: tender.id,
    tenderCode: tender.code,
    tenderTitle: tender.title,
    tenderName: tender.title,
    supplierId: supplier.id,
    supplierName: supplier.companyName,
    supplierEmail: supplier.email,
    supplierPhone: supplier.phone,
    status,
    submittedAt,
    createdAt: submittedAt,
    totalAmount,
    totalPrice: totalAmount,
    deliveryTime,
    paymentTerms,
    warrantyPolicy,
    note,
    items,
  };
}

const bids = [
  makeBid({
    id: "DEMO-BID-001",
    bidCode: "DEMO-BG-2026-001",
    tenderId: "DEMO-TDR-003",
    supplierId: "DEMO-SUP-003",
    status: "Đã nộp",
    submittedAt: toIso("2026-05-10", "09:10:00"),
    unitPrices: [525_000, 615_000],
    deliveryTime: "Mau size trong 7 ngay, giao dot 1 sau 25 ngay",
    paymentTerms: "Dat coc 20%, 80% sau nghiem thu",
    warrantyPolicy: "Bao hanh duong may 6 thang",
    note: "Bao gia su dung vai co gian nhe, phu hop nhan su van phong va nha xuong.",
    itemMeta: [
      { brand: "Sao Vang Uniform", origin: "Viet Nam" },
      { brand: "Sao Vang Workwear", origin: "Viet Nam" },
    ],
  }),
  makeBid({
    id: "DEMO-BID-002",
    bidCode: "DEMO-BG-2026-002",
    tenderId: "DEMO-TDR-003",
    supplierId: "DEMO-SUP-010",
    status: "Đã nộp",
    submittedAt: toIso("2026-05-11", "10:20:00"),
    unitPrices: [498_000, 642_000],
    deliveryTime: "Mau size trong 5 ngay, giao dong loat sau 30 ngay",
    paymentTerms: "Dat coc 15%, con lai sau giao hang",
    warrantyPolicy: "Bao hanh duong may 9 thang",
    note: "Nha may de xuat tang kem the ten vai cho khoi van phong.",
    itemMeta: [
      { brand: "Phuc An Corporate", origin: "Viet Nam" },
      { brand: "Phuc An Safety", origin: "Viet Nam" },
    ],
  }),
  makeBid({
    id: "DEMO-BID-003",
    bidCode: "DEMO-BG-2026-003",
    tenderId: "DEMO-TDR-003",
    supplierId: "DEMO-SUP-007",
    status: "Chờ xem xét",
    submittedAt: toIso("2026-05-12", "14:15:00"),
    unitPrices: [548_000, 628_000],
    deliveryTime: "Giao hang trong 32 ngay sau duyet mau",
    paymentTerms: "Thanh toan 100% sau nghiem thu",
    warrantyPolicy: "Bao hanh duong may 6 thang",
    note: "Don vi co nang luc in logo, nhung outsource cong doan may.",
    itemMeta: [
      { brand: "A Chau Apparel", origin: "Viet Nam" },
      { brand: "A Chau Workwear", origin: "Viet Nam" },
    ],
  }),
  makeBid({
    id: "DEMO-BID-004",
    bidCode: "DEMO-BG-2026-004",
    tenderId: "DEMO-TDR-004",
    supplierId: "DEMO-SUP-004",
    status: "Đã nộp",
    submittedAt: toIso("2026-05-09", "08:45:00"),
    unitPrices: [31_500_000, 44_000_000],
    deliveryTime: "Trien khai trong 35 ngay",
    paymentTerms: "Thanh toan 30 ngay sau nghiem thu tung xe",
    warrantyPolicy: "Bao hanh 9 thang cho phu tung thay moi",
    note: "Bao gia bao gom ky thuat vien onsite va xe nang du phong 2 ngay.",
    itemMeta: [
      { brand: "Toyota/Komatsu Service", origin: "Viet Nam" },
      { brand: "Doosan/Hangcha Service", origin: "Viet Nam" },
    ],
  }),
  makeBid({
    id: "DEMO-BID-005",
    bidCode: "DEMO-BG-2026-005",
    tenderId: "DEMO-TDR-004",
    supplierId: "DEMO-SUP-002",
    status: "Chờ xem xét",
    submittedAt: toIso("2026-05-10", "11:30:00"),
    unitPrices: [33_000_000, 46_500_000],
    deliveryTime: "Trien khai trong 30 ngay",
    paymentTerms: "Thanh toan sau 20 ngay ke tu khi nghiem thu",
    warrantyPolicy: "Bao hanh 6 thang",
    note: "Doi tac lien danh voi xưởng sua chua ben thu ba, gia canh tranh nhung can kiem tra phu tung.",
    itemMeta: [
      { brand: "Third-party Fleet Service", origin: "Viet Nam" },
      { brand: "Third-party Fleet Service", origin: "Viet Nam" },
    ],
  }),
  makeBid({
    id: "DEMO-BID-006",
    bidCode: "DEMO-BG-2026-006",
    tenderId: "DEMO-TDR-004",
    supplierId: "DEMO-SUP-008",
    status: "Cần bổ sung",
    submittedAt: toIso("2026-05-12", "09:50:00"),
    unitPrices: [35_500_000, 49_000_000],
    deliveryTime: "Trien khai trong 40 ngay",
    paymentTerms: "Thanh toan 100% sau nghiem thu",
    warrantyPolicy: "Bao hanh 6 thang",
    note: "Da nop bao gia nhung chua lam ro danh muc phu tung thay the.",
    itemMeta: [
      { brand: "Outsource Service", origin: "Viet Nam" },
      { brand: "Outsource Service", origin: "Viet Nam" },
    ],
  }),
  makeBid({
    id: "DEMO-BID-007",
    bidCode: "DEMO-BG-2026-007",
    tenderId: "DEMO-TDR-005",
    supplierId: "DEMO-SUP-005",
    status: "Đang đánh giá",
    submittedAt: toIso("2026-05-07", "09:00:00"),
    unitPrices: [148_000, 42_000_000],
    deliveryTime: "Ban giao kho sau 7 ngay ky hop dong",
    paymentTerms: "Thanh toan vao ngay 15 thang tiep theo",
    warrantyPolicy: "Cam ket uptime kho 99%",
    note: "Kho cach nha may 11km, co 4 cua xuat nhap va xe container vao duoc.",
    itemMeta: [
      { brand: "Dong Bac Warehouse", origin: "Quang Ninh" },
      { brand: "Dong Bac Operations", origin: "Quang Ninh" },
    ],
  }),
  makeBid({
    id: "DEMO-BID-008",
    bidCode: "DEMO-BG-2026-008",
    tenderId: "DEMO-TDR-005",
    supplierId: "DEMO-SUP-002",
    status: "Đang đánh giá",
    submittedAt: toIso("2026-05-07", "13:20:00"),
    unitPrices: [155_000, 38_000_000],
    deliveryTime: "Ban giao kho sau 10 ngay",
    paymentTerms: "Thanh toan 100% sau doi soat hang thang",
    warrantyPolicy: "Cam ket KPI ton kho va giao nhan",
    note: "Gia xep do tot, nhung kho cach nha may 27km.",
    itemMeta: [
      { brand: "Bac Nam Depot", origin: "Hai Phong" },
      { brand: "Bac Nam Operations", origin: "Hai Phong" },
    ],
  }),
  makeBid({
    id: "DEMO-BID-009",
    bidCode: "DEMO-BG-2026-009",
    tenderId: "DEMO-TDR-005",
    supplierId: "DEMO-SUP-001",
    status: "Chờ xem xét",
    submittedAt: toIso("2026-05-08", "15:10:00"),
    unitPrices: [162_000, 36_000_000],
    deliveryTime: "Ban giao kho sau 12 ngay",
    paymentTerms: "Thanh toan 20 ngay sau doi soat",
    warrantyPolicy: "Cam ket ton kho pallet an toan",
    note: "Doi tac de xuat kho nho hon nhu gan nha may va co san pallet dong bo.",
    itemMeta: [
      { brand: "Dong Duong Yard", origin: "Hai Phong" },
      { brand: "Dong Duong Handling", origin: "Hai Phong" },
    ],
  }),
  makeBid({
    id: "DEMO-BID-010",
    bidCode: "DEMO-BG-2026-010",
    tenderId: "DEMO-TDR-006",
    supplierId: "DEMO-SUP-006",
    status: "Đang đánh giá",
    submittedAt: toIso("2026-05-09", "10:00:00"),
    unitPrices: [22_800_000, 16_500_000, 28_400_000],
    deliveryTime: "Giao trong 18 ngay, onsite setup 3 ngay",
    paymentTerms: "Thanh toan 100% sau nghiem thu",
    warrantyPolicy: "Bao hanh onsite 24 thang, doi moi 30 ngay dau",
    note: "Phuong an ky thuat tot nhat, co onsite support tai Ha Long.",
    itemMeta: [
      { brand: "Dell Latitude", origin: "Malaysia" },
      { brand: "Cisco CBS", origin: "Singapore" },
      { brand: "Zebra", origin: "Mexico" },
    ],
  }),
  makeBid({
    id: "DEMO-BID-011",
    bidCode: "DEMO-BG-2026-011",
    tenderId: "DEMO-TDR-006",
    supplierId: "DEMO-SUP-007",
    status: "Chờ xem xét",
    submittedAt: toIso("2026-05-09", "16:30:00"),
    unitPrices: [21_900_000, 17_100_000, 30_200_000],
    deliveryTime: "Giao trong 22 ngay",
    paymentTerms: "Thanh toan 15 ngay sau nghiem thu",
    warrantyPolicy: "Bao hanh 18 thang",
    note: "Gia laptop tot nhung thiet bi ma vach phai dat hang 4-5 tuan.",
    itemMeta: [
      { brand: "HP ProBook", origin: "Thailand" },
      { brand: "Ruijie", origin: "China" },
      { brand: "TSC", origin: "Taiwan" },
    ],
  }),
  makeBid({
    id: "DEMO-BID-012",
    bidCode: "DEMO-BG-2026-012",
    tenderId: "DEMO-TDR-006",
    supplierId: "DEMO-SUP-010",
    status: "Cần bổ sung",
    submittedAt: toIso("2026-05-10", "08:40:00"),
    unitPrices: [23_500_000, 16_900_000, 29_500_000],
    deliveryTime: "Giao trong 25 ngay",
    paymentTerms: "Dat coc 30%, con lai sau nghiem thu",
    warrantyPolicy: "Bao hanh 24 thang",
    note: "Can bo sung tai lieu CO/CQ va serial hang mau.",
    itemMeta: [
      { brand: "Lenovo ThinkBook", origin: "China" },
      { brand: "TP-Link Omada", origin: "Vietnam/China" },
      { brand: "Honeywell", origin: "Mexico" },
    ],
  }),
  makeBid({
    id: "DEMO-BID-013",
    bidCode: "DEMO-BG-2026-013",
    tenderId: "DEMO-TDR-007",
    supplierId: "DEMO-SUP-007",
    status: "Được chọn",
    submittedAt: toIso("2026-05-02", "09:05:00"),
    unitPrices: [39_500, 8_950, 285_000],
    deliveryTime: "Giao 3 dot trong thang 5 va 6/2026",
    paymentTerms: "Thanh toan 30 ngay sau tung dot giao",
    warrantyPolicy: "Doi tra 100% neu test lot khong dat",
    note: "Bao gia tot nhat ve tong gia tri va co lich giao hang sat nhu cau san xuat.",
    itemMeta: [
      { brand: "A Chau Stretch", origin: "Viet Nam" },
      { brand: "A Chau Carton", origin: "Viet Nam" },
      { brand: "A Chau PET", origin: "Viet Nam" },
    ],
  }),
  makeBid({
    id: "DEMO-BID-014",
    bidCode: "DEMO-BG-2026-014",
    tenderId: "DEMO-TDR-007",
    supplierId: "DEMO-SUP-001",
    status: "Không được chọn",
    submittedAt: toIso("2026-05-02", "11:25:00"),
    unitPrices: [41_200, 9_100, 276_000],
    deliveryTime: "Giao 2 dot trong 5 tuan",
    paymentTerms: "Thanh toan 20 ngay sau giao",
    warrantyPolicy: "Bao hanh lot 3 thang",
    note: "Gia day dai tot nhung gia mang PE va carton cao hon doi thu.",
    itemMeta: [
      { brand: "Dong Duong Film", origin: "Viet Nam" },
      { brand: "Dong Duong Carton", origin: "Viet Nam" },
      { brand: "Dong Duong PET", origin: "Viet Nam" },
    ],
  }),
  makeBid({
    id: "DEMO-BID-015",
    bidCode: "DEMO-BG-2026-015",
    tenderId: "DEMO-TDR-007",
    supplierId: "DEMO-SUP-010",
    status: "Không được chọn",
    submittedAt: toIso("2026-05-03", "14:40:00"),
    unitPrices: [40_800, 9_350, 291_000],
    deliveryTime: "Giao 3 dot theo lich san xuat",
    paymentTerms: "Thanh toan 100% sau nghiem thu",
    warrantyPolicy: "Doi tra lot loi trong 7 ngay",
    note: "Nha cung cap co kha nang san xuat, nhung lead time dot dau cham hon muc yeu cau.",
    itemMeta: [
      { brand: "Phuc An Pack", origin: "Viet Nam" },
      { brand: "Phuc An Carton", origin: "Viet Nam" },
      { brand: "Phuc An PET", origin: "Viet Nam" },
    ],
  }),
];

const activityLogs = [
  {
    id: "DEMO-ACT-001",
    type: "supplier_profile",
    title: "Hoàn tất hồ sơ nhà cung cấp Pallet Nhựa Đông Dương",
    description: "Ho so nha cung cap demo da du thong tin lien he, danh muc nganh hang va file nang luc.",
    entityType: "supplier",
    entityId: "DEMO-SUP-001",
    actorName: "Trần Quốc Bảo",
    actorRole: "Admin",
    createdAt: toIso("2026-05-01", "08:15:00"),
  },
  {
    id: "DEMO-ACT-002",
    type: "supplier_profile",
    title: "Phê duyệt nhà cung cấp Bao bì Á Châu",
    description: "Nha cung cap duoc kich hoat de tham gia bao gia dong goi he 2026.",
    entityType: "supplier",
    entityId: "DEMO-SUP-007",
    actorName: "Nguyễn Thị Mai",
    actorRole: "Trưởng phòng vật tư",
    createdAt: toIso("2026-05-01", "09:30:00"),
  },
  {
    id: "DEMO-ACT-003",
    type: "tender_status",
    title: "Phát hành gói đồng phục nhân viên",
    description: "Goi DEMO-GT-2026-003 da duoc mo cho nha cung cap nop bao gia.",
    entityType: "tender",
    entityId: "DEMO-TDR-003",
    entityCode: "DEMO-GT-2026-003",
    actorName: "Hoàng Văn Quang",
    actorRole: "Kế hoạch vật tư",
    createdAt: toIso("2026-05-03", "08:45:00"),
  },
  {
    id: "DEMO-ACT-004",
    type: "tender_status",
    title: "Chuyển gói thuê kho phụ trợ sang đang đánh giá",
    description: "Da khoa nop bao gia va chuyen sang phan tich phuong an kho, gia va khoang cach.",
    entityType: "tender",
    entityId: "DEMO-TDR-005",
    entityCode: "DEMO-GT-2026-005",
    actorName: "Nguyễn Thị Mai",
    actorRole: "Trưởng phòng vật tư",
    createdAt: toIso("2026-05-08", "17:10:00"),
  },
  {
    id: "DEMO-ACT-005",
    type: "bid_status",
    title: "Yêu cầu bổ sung báo giá thiết bị CNTT",
    description: "NCC bo sung CO/CQ va serial mau cho goi DEMO-GT-2026-006.",
    entityType: "bid",
    entityId: "DEMO-BID-012",
    entityCode: "DEMO-BG-2026-012",
    actorName: "Hoàng Văn Quang",
    actorRole: "Kế hoạch vật tư",
    createdAt: toIso("2026-05-10", "10:45:00"),
  },
  {
    id: "DEMO-ACT-006",
    type: "winner_selected",
    title: "Chọn nhà cung cấp trúng thầu cho gói đóng gói hè 2026",
    description: "Chọn Công ty Cổ phần Bao bì Á Châu cho gói DEMO-GT-2026-007 sau khi so sánh giá, lead time và năng lực giao hàng.",
    entityType: "tender",
    entityId: "DEMO-TDR-007",
    entityCode: "DEMO-GT-2026-007",
    actorName: "Lê Thu Hương",
    actorRole: "Ban giám đốc",
    createdAt: toIso("2026-05-12", "15:20:00"),
  },
  {
    id: "DEMO-ACT-007",
    type: "tender_status",
    title: "Hủy gói vệ sinh nhà máy",
    description: "Tam huy goi DEMO-GT-2026-008 de dieu chinh lai pham vi cong viec va KPI thuc hien.",
    entityType: "tender",
    entityId: "DEMO-TDR-008",
    entityCode: "DEMO-GT-2026-008",
    actorName: "Nguyễn Thị Mai",
    actorRole: "Trưởng phòng vật tư",
    createdAt: toIso("2026-05-13", "11:35:00"),
  },
];

async function upsertCategory(client, category) {
  await client.query(
    `insert into procurement_groups (id, code, name, description, status, created_at, updated_at, raw_data)
     values ($1, $2, $3, $4, $5, $6, now(), $7::jsonb)
     on conflict (id) do update set
       code = excluded.code,
       name = excluded.name,
       description = excluded.description,
       status = excluded.status,
       updated_at = now(),
       raw_data = excluded.raw_data`,
    [
      category.id,
      category.code,
      category.name,
      category.description ?? null,
      category.status,
      category.createdAt,
      JSON.stringify(withDemoMeta(category)),
    ],
  );
}

async function upsertMaterial(client, material) {
  await client.query(
    `insert into material_items (
      id, category_id, category_name, material_code, material_name,
      specification, unit, description, status, created_at, updated_at, raw_data
    ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now(), $11::jsonb)
    on conflict (id) do update set
      category_id = excluded.category_id,
      category_name = excluded.category_name,
      material_code = excluded.material_code,
      material_name = excluded.material_name,
      specification = excluded.specification,
      unit = excluded.unit,
      description = excluded.description,
      status = excluded.status,
      updated_at = now(),
      raw_data = excluded.raw_data`,
    [
      material.id,
      material.categoryId,
      material.categoryName,
      material.materialCode,
      material.materialName,
      material.specification ?? null,
      material.unit,
      material.description ?? null,
      material.status,
      material.createdAt,
      JSON.stringify(withDemoMeta(material)),
    ],
  );
}

async function upsertInternalUser(client, user) {
  await client.query(
    `insert into internal_users (
      id, full_name, email, password, role, department, status, created_at, updated_at, raw_data
    ) values ($1, $2, $3, $4, $5, $6, $7, $8, now(), $9::jsonb)
    on conflict (id) do update set
      full_name = excluded.full_name,
      email = excluded.email,
      password = excluded.password,
      role = excluded.role,
      department = excluded.department,
      status = excluded.status,
      updated_at = now(),
      raw_data = excluded.raw_data`,
    [
      user.id,
      user.fullName,
      user.email,
      user.password,
      user.role,
      user.department,
      user.status,
      user.createdAt,
      JSON.stringify(withDemoMeta(user)),
    ],
  );
}

async function upsertSupplier(client, supplier) {
  await client.query(
    `insert into suppliers (
      id, company_name, tax_code, contact_name, email, phone, password,
      profile_completed, status, address, province, website,
      business_description, categories, created_at, updated_at, raw_data
    ) values (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9, $10, $11, $12,
      $13, $14::jsonb, $15, now(), $16::jsonb
    )
    on conflict (id) do update set
      company_name = excluded.company_name,
      tax_code = excluded.tax_code,
      contact_name = excluded.contact_name,
      email = excluded.email,
      phone = excluded.phone,
      password = excluded.password,
      profile_completed = excluded.profile_completed,
      status = excluded.status,
      address = excluded.address,
      province = excluded.province,
      website = excluded.website,
      business_description = excluded.business_description,
      categories = excluded.categories,
      updated_at = now(),
      raw_data = excluded.raw_data`,
    [
      supplier.id,
      supplier.companyName,
      supplier.taxCode,
      supplier.contactName,
      supplier.email,
      supplier.phone,
      supplier.password,
      supplier.profileCompleted,
      supplier.status,
      supplier.address ?? null,
      supplier.province ?? null,
      supplier.website ?? null,
      supplier.businessDescription ?? null,
      JSON.stringify(supplier.categories ?? []),
      supplier.createdAt,
      JSON.stringify(withDemoMeta(supplier)),
    ],
  );
}

async function upsertTender(client, tender) {
  await client.query("delete from tender_items where tender_id = $1", [tender.id]);
  await client.query(
    `insert into tenders (
      id, code, title, category, status, deadline, estimated_value,
      description, delivery_location, delivery_time, payment_terms,
      document_requirements, created_at, updated_at, raw_data
    ) values (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9, $10, $11,
      $12::jsonb, $13, now(), $14::jsonb
    )
    on conflict (id) do update set
      code = excluded.code,
      title = excluded.title,
      category = excluded.category,
      status = excluded.status,
      deadline = excluded.deadline,
      estimated_value = excluded.estimated_value,
      description = excluded.description,
      delivery_location = excluded.delivery_location,
      delivery_time = excluded.delivery_time,
      payment_terms = excluded.payment_terms,
      document_requirements = excluded.document_requirements,
      updated_at = now(),
      raw_data = excluded.raw_data`,
    [
      tender.id,
      tender.code,
      tender.title,
      tender.category,
      tender.status,
      tender.deadline,
      tender.estimatedValue,
      tender.description,
      tender.deliveryLocation,
      tender.deliveryTime,
      tender.paymentTerms,
      JSON.stringify(tender.documentRequirements ?? []),
      tender.createdAt,
      JSON.stringify(withDemoMeta(tender)),
    ],
  );

  for (const [index, item] of tender.items.entries()) {
    await client.query(
      `insert into tender_items (
        id, tender_id, material_id, material_code, item_name, specification,
        quantity, unit, note, sort_order, raw_data
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)
      on conflict (id) do update set
        tender_id = excluded.tender_id,
        material_id = excluded.material_id,
        material_code = excluded.material_code,
        item_name = excluded.item_name,
        specification = excluded.specification,
        quantity = excluded.quantity,
        unit = excluded.unit,
        note = excluded.note,
        sort_order = excluded.sort_order,
        raw_data = excluded.raw_data`,
      [
        item.id,
        tender.id,
        item.materialId ?? null,
        item.materialCode ?? null,
        item.itemName,
        item.specification ?? null,
        item.quantity,
        item.unit,
        item.note ?? null,
        index,
        JSON.stringify(withDemoMeta(item)),
      ],
    );
  }
}

async function upsertBid(client, bid) {
  await client.query("delete from bid_items where bid_id = $1", [bid.id]);
  await client.query(
    `insert into bids (
      id, bid_code, tender_id, tender_code, tender_title, supplier_id,
      supplier_name, supplier_email, supplier_phone, status, submitted_at,
      total_amount, delivery_time, payment_terms, warranty_policy, note,
      created_at, updated_at, raw_data
    ) values (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10, $11,
      $12, $13, $14, $15, $16,
      $17, now(), $18::jsonb
    )
    on conflict (id) do update set
      bid_code = excluded.bid_code,
      tender_id = excluded.tender_id,
      tender_code = excluded.tender_code,
      tender_title = excluded.tender_title,
      supplier_id = excluded.supplier_id,
      supplier_name = excluded.supplier_name,
      supplier_email = excluded.supplier_email,
      supplier_phone = excluded.supplier_phone,
      status = excluded.status,
      submitted_at = excluded.submitted_at,
      total_amount = excluded.total_amount,
      delivery_time = excluded.delivery_time,
      payment_terms = excluded.payment_terms,
      warranty_policy = excluded.warranty_policy,
      note = excluded.note,
      updated_at = now(),
      raw_data = excluded.raw_data`,
    [
      bid.id,
      bid.bidCode,
      bid.tenderId,
      bid.tenderCode,
      bid.tenderTitle,
      bid.supplierId,
      bid.supplierName,
      bid.supplierEmail ?? null,
      bid.supplierPhone ?? null,
      bid.status,
      bid.submittedAt,
      bid.totalAmount,
      bid.deliveryTime ?? null,
      bid.paymentTerms ?? null,
      bid.warrantyPolicy ?? null,
      bid.note ?? null,
      bid.createdAt ?? bid.submittedAt,
      JSON.stringify(withDemoMeta(bid)),
    ],
  );

  for (const [index, item] of bid.items.entries()) {
    await client.query(
      `insert into bid_items (
        id, bid_id, tender_item_id, item_name, specification, quantity,
        unit, unit_price, amount, brand, origin, delivery_time, note,
        sort_order, raw_data
      ) values (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12, $13,
        $14, $15::jsonb
      )
      on conflict (id) do update set
        bid_id = excluded.bid_id,
        tender_item_id = excluded.tender_item_id,
        item_name = excluded.item_name,
        specification = excluded.specification,
        quantity = excluded.quantity,
        unit = excluded.unit,
        unit_price = excluded.unit_price,
        amount = excluded.amount,
        brand = excluded.brand,
        origin = excluded.origin,
        delivery_time = excluded.delivery_time,
        note = excluded.note,
        sort_order = excluded.sort_order,
        raw_data = excluded.raw_data`,
      [
        item.id,
        bid.id,
        item.tenderItemId,
        item.itemName,
        item.specification ?? null,
        item.quantity,
        item.unit,
        item.unitPrice,
        item.amount,
        item.brand ?? null,
        item.origin ?? null,
        item.deliveryTime ?? null,
        item.note ?? null,
        index,
        JSON.stringify(withDemoMeta(item)),
      ],
    );
  }
}

async function upsertActivity(client, log) {
  await client.query(
    `insert into audit_events (
      id, type, title, description, entity_type, entity_id, entity_code,
      actor_name, actor_role, created_at, raw_data
    ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)
    on conflict (id) do update set
      type = excluded.type,
      title = excluded.title,
      description = excluded.description,
      entity_type = excluded.entity_type,
      entity_id = excluded.entity_id,
      entity_code = excluded.entity_code,
      actor_name = excluded.actor_name,
      actor_role = excluded.actor_role,
      created_at = excluded.created_at,
      raw_data = excluded.raw_data`,
    [
      log.id,
      log.type,
      log.title,
      log.description ?? null,
      log.entityType ?? null,
      log.entityId ?? null,
      log.entityCode ?? null,
      log.actorName ?? null,
      log.actorRole ?? null,
      log.createdAt,
      JSON.stringify(withDemoMeta(log)),
    ],
  );
}

async function readCount(client, tableName) {
  const result = await client.query(`select count(*)::int as total from ${tableName} where raw_data ->> '_demoSeed' = $1`, [DEMO_SEED_KEY]);
  return result.rows[0]?.total ?? 0;
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query("begin");
    for (const category of categories) {
      await upsertCategory(client, category);
    }
    for (const material of materials) {
      await upsertMaterial(client, material);
    }
    for (const user of internalUsers) {
      await upsertInternalUser(client, user);
    }
    for (const supplier of suppliers) {
      await upsertSupplier(client, supplier);
    }
    for (const tender of tenders) {
      await upsertTender(client, tender);
    }
    for (const bid of bids) {
      await upsertBid(client, bid);
    }
    for (const log of activityLogs) {
      await upsertActivity(client, log);
    }

    await client.query("commit");

    const counts = {
      procurement_groups: await readCount(client, "procurement_groups"),
      material_items: await readCount(client, "material_items"),
      internal_users: await readCount(client, "internal_users"),
      suppliers: await readCount(client, "suppliers"),
      tenders: await readCount(client, "tenders"),
      tender_items: await readCount(client, "tender_items"),
      bids: await readCount(client, "bids"),
      bid_items: await readCount(client, "bid_items"),
      audit_events: await readCount(client, "audit_events"),
    };

    console.log("Seeded ProcureHub demo data successfully.");
    console.table(counts);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Failed to seed demo data.");
  console.error(error);
  process.exitCode = 1;
});
