import type { Tender } from "@/types/tender";

export const tenders: Tender[] = [
  {
    id: "1",
    code: "GT-2025-001",
    name: "Cung cấp thép cuộn cán nóng Q195/Q235 dùng sản xuất khung thép",
    category: "Nguyên vật liệu",
    inviter: "Bia Hạ Long",
    deadline: "15/06/2025",
    status: "Đang mở",
    value: "2.400.000.000 ₫",
    description:
      "Yêu cầu cung cấp thép cuộn cán nóng tiêu chuẩn Q195/Q235, dày 1.5–4mm, khổ 1000–1250mm. Số lượng dự kiến 80–100 tấn/tháng. Giao hàng tại nhà máy KCN Việt Hưng, Hạ Long.",
    items: [
      { name: "Thép cuộn cán nóng Q195", spec: "Dày 1.5–2mm, khổ 1000mm", quantity: 40, unit: "Tấn", note: "Tiêu chuẩn GB/T 709" },
      { name: "Thép cuộn cán nóng Q195", spec: "Dày 2–3mm, khổ 1250mm", quantity: 20, unit: "Tấn" },
      { name: "Thép cuộn cán nóng Q235", spec: "Dày 3–4mm, khổ 1000mm", quantity: 20, unit: "Tấn", note: "Tiêu chuẩn GB/T 709" },
      { name: "Thép cuộn cán nóng Q235", spec: "Dày 3–4mm, khổ 1250mm", quantity: 20, unit: "Tấn", note: "Giao theo lịch hàng tháng" },
    ],
    commercialTerms: {
      deliveryLocation: "Kho nguyên liệu – KCN Việt Hưng, TP. Hạ Long, Quảng Ninh",
      deliveryTime: "10–15 ngày làm việc sau ký hợp đồng; giao hàng định kỳ hàng tháng",
      paymentTerms: "Thanh toán 100% trong vòng 30 ngày sau khi giao hàng và nghiệm thu chất lượng",
      quotationRequirements: [
        "Báo giá theo mẫu đính kèm (file XLSX)",
        "Chứng chỉ chất lượng CO/CQ kèm phiếu kiểm tra từng lô hàng",
        "Tiêu chuẩn kỹ thuật và catalogue sản phẩm",
        "Hồ sơ năng lực doanh nghiệp (giấy phép kinh doanh, BCTC năm gần nhất)",
      ],
    },
    documents: [
      { name: "Thông báo mời thầu GT-2025-001.pdf", fileType: "PDF", size: "248 KB" },
      { name: "Yêu cầu kỹ thuật – Thép cuộn cán nóng.pdf", fileType: "PDF", size: "534 KB" },
      { name: "Mẫu báo giá GT-2025-001.xlsx", fileType: "XLSX", size: "42 KB" },
    ],
    timeline: [
      { label: "Phát hành gói thầu", date: "01/06/2025", completed: true },
      { label: "Nhận hồ sơ báo giá", date: "10/06/2025", completed: true },
      { label: "Đóng thầu", date: "15/06/2025", completed: false },
      { label: "Đánh giá báo giá", date: "22/06/2025", completed: false },
      { label: "Công bố kết quả", date: "30/06/2025", completed: false },
    ],
  },
  {
    id: "2",
    code: "GT-2025-002",
    name: "Cung cấp và lắp đặt máy nén khí trục vít công nghiệp 37kW",
    category: "Máy móc",
    inviter: "Bia Hạ Long",
    deadline: "20/06/2025",
    status: "Đang mở",
    value: "850.000.000 ₫",
    description:
      "Cần mua sắm 02 bộ máy nén khí trục vít có công suất 37kW, lưu lượng ≥ 6,5 m³/phút, áp suất làm việc 8 bar. Bao gồm lắp đặt, đào tạo vận hành và bảo hành 24 tháng.",
    items: [
      { name: "Máy nén khí trục vít", spec: "Công suất 37kW, Q ≥ 6.5m³/phút, áp 8 bar", quantity: 2, unit: "Bộ", note: "Hãng Atlas Copco hoặc tương đương" },
      { name: "Bình tích khí (Air receiver)", spec: "Dung tích 1.000L, áp 10 bar", quantity: 2, unit: "Cái", note: "Kèm van an toàn" },
      { name: "Bộ lọc khí sau máy nén", spec: "Lọc 3 cấp: hạt, dầu, vi khuẩn", quantity: 2, unit: "Bộ" },
      { name: "Phần mềm giám sát từ xa", spec: "Kết nối LAN, giao diện web", quantity: 1, unit: "Gói", note: "Tích hợp SCADA nếu có" },
    ],
    commercialTerms: {
      deliveryLocation: "Phân xưởng sản xuất – Nhà máy Bia Hạ Long, KCN Việt Hưng",
      deliveryTime: "45–60 ngày sau ký hợp đồng; lắp đặt và chạy thử trong 5 ngày làm việc",
      paymentTerms: "30% đặt cọc sau ký hợp đồng, 60% sau giao hàng, 10% sau nghiệm thu 30 ngày vận hành ổn định",
      quotationRequirements: [
        "Báo giá chi tiết từng hạng mục (thiết bị, lắp đặt, đào tạo)",
        "Catalogue và datasheet thiết bị đầy đủ thông số kỹ thuật",
        "Phương án bảo hành 24 tháng và bảo trì định kỳ",
        "Danh sách dự án tham chiếu tương tự trong 2 năm gần nhất",
      ],
    },
    documents: [
      { name: "Thông báo mời thầu GT-2025-002.pdf", fileType: "PDF", size: "312 KB" },
      { name: "Thông số kỹ thuật – Máy nén khí 37kW.pdf", fileType: "PDF", size: "728 KB" },
      { name: "Mẫu báo giá GT-2025-002.xlsx", fileType: "XLSX", size: "55 KB" },
    ],
    timeline: [
      { label: "Phát hành gói thầu", date: "05/06/2025", completed: true },
      { label: "Nhận hồ sơ báo giá", date: "15/06/2025", completed: true },
      { label: "Đóng thầu", date: "20/06/2025", completed: false },
      { label: "Đánh giá báo giá", date: "28/06/2025", completed: false },
      { label: "Công bố kết quả", date: "10/07/2025", completed: false },
    ],
  },
  {
    id: "3",
    code: "GT-2025-003",
    name: "Cung cấp thiết bị đo kiểm – máy đo tọa độ 3D CMM và dụng cụ đo",
    category: "Thiết bị",
    inviter: "Bia Hạ Long",
    deadline: "10/06/2025",
    status: "Sắp đóng",
    value: "1.200.000.000 ₫",
    description:
      "Trang bị hệ thống đo kiểm chất lượng cho xưởng cơ khí bao gồm 01 máy đo tọa độ 3D CMM, bộ panme điện tử, thước cặp điện tử và thiết bị đo độ nhám bề mặt.",
    items: [
      { name: "Máy đo tọa độ 3D CMM", spec: "Hành trình 500×700×500mm, độ chính xác ±2μm", quantity: 1, unit: "Máy", note: "Hãng Zeiss hoặc Hexagon" },
      { name: "Panme điện tử", spec: "Dải đo 0–150mm, độ phân giải 0.001mm", quantity: 5, unit: "Cái", note: "Hãng Mitutoyo hoặc tương đương" },
      { name: "Thước cặp điện tử", spec: "Dải đo 0–200mm, đọc số 4 chiều", quantity: 10, unit: "Cái", note: "Độ chính xác ±0.02mm" },
      { name: "Thiết bị đo độ nhám bề mặt", spec: "Ra 0.01–160μm, đầu dò kim cương", quantity: 2, unit: "Cái", note: "Kèm phần mềm phân tích" },
    ],
    commercialTerms: {
      deliveryLocation: "Xưởng cơ khí – Nhà máy Bia Hạ Long, KCN Việt Hưng",
      deliveryTime: "30–45 ngày sau ký hợp đồng; lắp đặt, hiệu chỉnh và đào tạo trong 3 ngày",
      paymentTerms: "Thanh toán 100% trong vòng 45 ngày sau khi giao hàng, lắp đặt và nghiệm thu đạt yêu cầu",
      quotationRequirements: [
        "Báo giá từng hạng mục thiết bị và dịch vụ kèm theo",
        "Chứng chỉ hiệu chuẩn (Calibration Certificate) gốc của nhà sản xuất",
        "Catalogue và datasheet đầy đủ thông số kỹ thuật",
        "Điều kiện bảo hành và chính sách hỗ trợ kỹ thuật sau bán",
      ],
    },
    documents: [
      { name: "Thông báo mời thầu GT-2025-003.pdf", fileType: "PDF", size: "276 KB" },
      { name: "Yêu cầu kỹ thuật – Thiết bị đo kiểm.pdf", fileType: "PDF", size: "612 KB" },
      { name: "Mẫu báo giá GT-2025-003.xlsx", fileType: "XLSX", size: "48 KB" },
    ],
    timeline: [
      { label: "Phát hành gói thầu", date: "25/05/2025", completed: true },
      { label: "Nhận hồ sơ báo giá", date: "05/06/2025", completed: true },
      { label: "Đóng thầu", date: "10/06/2025", completed: false },
      { label: "Đánh giá báo giá", date: "17/06/2025", completed: false },
      { label: "Công bố kết quả", date: "25/06/2025", completed: false },
    ],
  },
  {
    id: "4",
    code: "GT-2025-004",
    name: "Cung cấp dầu nhớt công nghiệp ISO VG 46 và ISO VG 68 số lượng lớn",
    category: "Nguyên vật liệu",
    inviter: "Bia Hạ Long",
    deadline: "25/06/2025",
    status: "Đang mở",
    value: "380.000.000 ₫",
    description:
      "Cung cấp dầu thủy lực ISO VG 46 (600 lít) và dầu hộp số ISO VG 68 (400 lít) theo tiêu chuẩn DIN 51524. Đóng gói 200 lít/thùng, giao hàng định kỳ hàng quý.",
    items: [
      { name: "Dầu thủy lực ISO VG 46", spec: "Tiêu chuẩn DIN 51524 Part 2 HLP", quantity: 600, unit: "Lít", note: "Đóng gói 200L/thùng" },
      { name: "Dầu hộp số ISO VG 68", spec: "Tiêu chuẩn DIN 51517 Part 3 CLP", quantity: 400, unit: "Lít", note: "Đóng gói 200L/thùng" },
      { name: "Dầu bôi trơn tổng hợp ISO VG 32", spec: "Dùng cho máy nén khí trục vít", quantity: 100, unit: "Lít", note: "Thùng 20L" },
    ],
    commercialTerms: {
      deliveryLocation: "Kho vật tư kỹ thuật – Nhà máy Bia Hạ Long, KCN Việt Hưng",
      deliveryTime: "5–7 ngày làm việc sau đặt hàng; giao hàng định kỳ hàng quý",
      paymentTerms: "Thanh toán 100% trong vòng 30 ngày sau khi giao hàng và kiểm tra chất lượng",
      quotationRequirements: [
        "Báo giá theo mẫu đính kèm (đơn giá/lít và đơn giá theo thùng)",
        "Phiếu phân tích kỹ thuật (TDS – Technical Data Sheet)",
        "Chứng chỉ chất lượng của nhà sản xuất",
        "Hồ sơ năng lực nhà phân phối ủy quyền (nếu không phải nhà sản xuất trực tiếp)",
      ],
    },
    documents: [
      { name: "Thông báo mời thầu GT-2025-004.pdf", fileType: "PDF", size: "195 KB" },
      { name: "Danh mục vật tư và thông số kỹ thuật.pdf", fileType: "PDF", size: "348 KB" },
      { name: "Mẫu báo giá GT-2025-004.xlsx", fileType: "XLSX", size: "36 KB" },
    ],
    timeline: [
      { label: "Phát hành gói thầu", date: "10/06/2025", completed: true },
      { label: "Nhận hồ sơ báo giá", date: "20/06/2025", completed: true },
      { label: "Đóng thầu", date: "25/06/2025", completed: false },
      { label: "Đánh giá báo giá", date: "01/07/2025", completed: false },
      { label: "Công bố kết quả", date: "10/07/2025", completed: false },
    ],
  },
  {
    id: "5",
    code: "GT-2025-005",
    name: "Dịch vụ bảo trì định kỳ hệ thống điện nhà xưởng năm 2025–2026",
    category: "Dịch vụ phụ trợ",
    inviter: "Bia Hạ Long",
    deadline: "30/06/2025",
    status: "Đang mở",
    value: "560.000.000 ₫",
    description:
      "Hợp đồng bảo trì hệ thống điện hạ thế và trung thế toàn nhà máy, chu kỳ bảo trì 3 tháng/lần. Yêu cầu đơn vị có giấy phép hoạt động điện lực và kỹ sư có chứng chỉ hành nghề.",
    items: [
      { name: "Bảo trì định kỳ hệ thống điện hạ thế", spec: "Kiểm tra, vệ sinh, siết chặt mạch điện toàn nhà máy", quantity: 4, unit: "Lần/năm", note: "Mỗi 3 tháng/lần" },
      { name: "Bảo trì định kỳ hệ thống điện trung thế", spec: "Kiểm tra MBA, tủ RMU, cáp 22kV", quantity: 2, unit: "Lần/năm", note: "Mỗi 6 tháng/lần" },
      { name: "Thử nghiệm an toàn điện định kỳ", spec: "Đo điện trở cách điện, tiếp địa, bảo vệ quá dòng", quantity: 1, unit: "Lần/năm", note: "Theo lịch bảo dưỡng lớn" },
      { name: "Ứng trực xử lý sự cố điện khẩn cấp", spec: "Phản hồi trong 2 giờ, 24/7 toàn năm", quantity: 1, unit: "Hợp đồng" },
    ],
    commercialTerms: {
      deliveryLocation: "Toàn bộ nhà máy – KCN Việt Hưng, TP. Hạ Long (diện tích ~15.000m²)",
      deliveryTime: "Triển khai trong 7 ngày kể từ ngày ký hợp đồng; thực hiện theo lịch bảo trì đã thống nhất",
      paymentTerms: "Thanh toán theo từng lần bảo trì, trong vòng 15 ngày sau khi hoàn thành và nghiệm thu",
      quotationRequirements: [
        "Báo giá theo đơn giá từng hạng mục công việc",
        "Hồ sơ năng lực và giấy phép hoạt động điện lực còn hiệu lực",
        "CV kỹ sư và chứng chỉ hành nghề điện liên quan",
        "Kế hoạch triển khai và phương án xử lý sự cố khẩn cấp",
      ],
    },
    documents: [
      { name: "Thông báo mời thầu GT-2025-005.pdf", fileType: "PDF", size: "289 KB" },
      { name: "Phạm vi công việc và yêu cầu kỹ thuật điện.pdf", fileType: "PDF", size: "456 KB" },
      { name: "Mẫu báo giá GT-2025-005.xlsx", fileType: "XLSX", size: "38 KB" },
    ],
    timeline: [
      { label: "Phát hành gói thầu", date: "15/06/2025", completed: true },
      { label: "Nhận hồ sơ báo giá", date: "25/06/2025", completed: true },
      { label: "Đóng thầu", date: "30/06/2025", completed: false },
      { label: "Đánh giá báo giá", date: "07/07/2025", completed: false },
      { label: "Công bố kết quả", date: "15/07/2025", completed: false },
    ],
  },
  {
    id: "6",
    code: "GT-2025-006",
    name: "Cung cấp bộ công cụ cắt gọt kim loại (dao phay, mũi khoan, dao tiện)",
    category: "Công cụ dụng cụ",
    inviter: "Bia Hạ Long",
    deadline: "05/06/2025",
    status: "Sắp đóng",
    value: "145.000.000 ₫",
    description:
      "Bổ sung kho vật tư tiêu hao cho phân xưởng cơ khí: dao phay ngón phi 6–25mm hợp kim cứng, mũi khoan HSS-Co 3–20mm, dao tiện ren và dao tiện ngoài hãng Sandvik hoặc tương đương.",
    items: [
      { name: "Dao phay ngón hợp kim cứng", spec: "Phi 6–12mm, 4 me, phủ TiAlN", quantity: 30, unit: "Cái", note: "Hãng Sandvik/Seco hoặc tương đương" },
      { name: "Dao phay ngón hợp kim cứng", spec: "Phi 14–25mm, 4 me, phủ TiAlN", quantity: 20, unit: "Cái" },
      { name: "Mũi khoan HSS-Co (bộ 8 cỡ)", spec: "Đường kính 3–10mm, DIN 338", quantity: 15, unit: "Bộ", note: "NACHI hoặc tương đương" },
      { name: "Mũi khoan HSS-Co (bộ 5 cỡ)", spec: "Đường kính 12–20mm, DIN 338", quantity: 10, unit: "Bộ" },
      { name: "Mảnh dao tiện ren ngoài", spec: "Insert CNMG 120408, Grade M30", quantity: 50, unit: "Mảnh" },
      { name: "Mảnh dao tiện ngoài thô", spec: "Insert WNMG 080408, Grade P30", quantity: 40, unit: "Mảnh" },
    ],
    commercialTerms: {
      deliveryLocation: "Kho công cụ – Phân xưởng cơ khí, Nhà máy Bia Hạ Long",
      deliveryTime: "7–10 ngày làm việc sau khi đặt hàng",
      paymentTerms: "Thanh toán 100% trong vòng 30 ngày sau khi giao hàng",
      quotationRequirements: [
        "Báo giá từng chủng loại với đơn giá và số lượng tối thiểu",
        "Catalogue kỹ thuật đầy đủ thông số cắt gọt đề xuất",
        "Chính sách đổi trả hàng lỗi trong 90 ngày",
        "Thông tin đại diện kỹ thuật hỗ trợ tại chỗ khi cần",
      ],
    },
    documents: [
      { name: "Thông báo mời thầu GT-2025-006.pdf", fileType: "PDF", size: "218 KB" },
      { name: "Danh mục chi tiết công cụ cần mua.xlsx", fileType: "XLSX", size: "62 KB" },
      { name: "Mẫu báo giá GT-2025-006.xlsx", fileType: "XLSX", size: "44 KB" },
    ],
    timeline: [
      { label: "Phát hành gói thầu", date: "22/05/2025", completed: true },
      { label: "Nhận hồ sơ báo giá", date: "01/06/2025", completed: true },
      { label: "Đóng thầu", date: "05/06/2025", completed: false },
      { label: "Đánh giá báo giá", date: "10/06/2025", completed: false },
      { label: "Công bố kết quả", date: "18/06/2025", completed: false },
    ],
  },
  {
    id: "7",
    code: "GT-2025-007",
    name: "Cung cấp và lắp đặt hệ thống camera giám sát nhà xưởng sản xuất",
    category: "Thiết bị",
    inviter: "Bia Hạ Long",
    deadline: "18/07/2025",
    status: "Đang mở",
    value: "420.000.000 ₫",
    description:
      "Trang bị hệ thống camera IP độ phân giải 4K cho 3 khu vực: kho nguyên liệu, phân xưởng đóng lon và khu vực xuất hàng. Bao gồm server lưu trữ NAS và phần mềm quản lý tập trung.",
    items: [
      { name: "Camera IP ngoài trời 4K", spec: "H.265+, góc rộng 120°, IP67, kèm nguồn PoE", quantity: 20, unit: "Cái", note: "Hikvision DS-2CD2T87G2 hoặc tương đương" },
      { name: "Camera IP trong nhà 4K dome", spec: "H.265+, AI phát hiện người, IR 30m", quantity: 15, unit: "Cái", note: "Bố trí kho nguyên liệu" },
      { name: "Server NAS lưu trữ", spec: "8-bay, RAID 5, 8×4TB HDD, Gigabit LAN", quantity: 2, unit: "Cái", note: "Lưu trữ tối thiểu 160 ngày" },
      { name: "Phần mềm quản lý camera VMS", spec: "Quản lý tập trung ≥100 camera, web-based", quantity: 1, unit: "Bản quyền" },
      { name: "Switch mạng PoE 24 cổng", spec: "Gigabit PoE+, rack-mount, công suất 370W", quantity: 3, unit: "Cái", note: "Kèm cáp mạng Cat6 và phụ kiện" },
    ],
    commercialTerms: {
      deliveryLocation: "Kho nguyên liệu (khu A), phân xưởng đóng lon (khu B), khu xuất hàng (khu C) – Nhà máy Bia Hạ Long",
      deliveryTime: "30–45 ngày sau ký hợp đồng; lắp đặt và cấu hình trong 5–7 ngày làm việc",
      paymentTerms: "40% đặt cọc sau ký hợp đồng, 50% sau lắp đặt hoàn chỉnh, 10% sau nghiệm thu 30 ngày",
      quotationRequirements: [
        "Báo giá chi tiết thiết bị, cáp, vật tư và nhân công lắp đặt tách biệt",
        "Sơ đồ bố trí camera đề xuất cho từng khu vực",
        "Datasheet thiết bị và phần mềm VMS",
        "Phương án bảo hành 24 tháng và dịch vụ bảo trì hàng năm",
      ],
    },
    documents: [
      { name: "Thông báo mời thầu GT-2025-007.pdf", fileType: "PDF", size: "334 KB" },
      { name: "Sơ đồ mặt bằng 3 khu vực lắp đặt.pdf", fileType: "PDF", size: "1.2 MB" },
      { name: "Yêu cầu kỹ thuật hệ thống camera.pdf", fileType: "PDF", size: "498 KB" },
      { name: "Mẫu báo giá GT-2025-007.xlsx", fileType: "XLSX", size: "52 KB" },
    ],
    timeline: [
      { label: "Phát hành gói thầu", date: "01/07/2025", completed: true },
      { label: "Nhận hồ sơ báo giá", date: "12/07/2025", completed: true },
      { label: "Đóng thầu", date: "18/07/2025", completed: false },
      { label: "Đánh giá báo giá", date: "25/07/2025", completed: false },
      { label: "Công bố kết quả", date: "05/08/2025", completed: false },
    ],
  },
  {
    id: "8",
    code: "GT-2025-008",
    name: "Dịch vụ vệ sinh công nghiệp nhà máy và kho lạnh định kỳ",
    category: "Dịch vụ phụ trợ",
    inviter: "Bia Hạ Long",
    deadline: "25/05/2025",
    status: "Đã đóng",
    value: "210.000.000 ₫",
    description:
      "Dịch vụ vệ sinh công nghiệp định kỳ tháng cho toàn bộ nhà xưởng (12.000 m²), kho lạnh bảo quản nguyên liệu và hệ thống ống dẫn lạnh. Nhà thầu cần có kinh nghiệm vệ sinh thực phẩm.",
    items: [
      { name: "Vệ sinh nhà xưởng sản xuất", spec: "Toàn bộ 12.000m² sàn, tường, trần", quantity: 12, unit: "Lần/năm", note: "Bao gồm hóa chất và thiết bị" },
      { name: "Vệ sinh kho lạnh bảo quản", spec: "Panel, nền, giá kệ và ống lạnh", quantity: 6, unit: "Lần/năm" },
      { name: "Vệ sinh hệ thống ống dẫn lạnh", spec: "Làm sạch cáu bẩn và vi sinh trong đường ống", quantity: 2, unit: "Lần/năm", note: "Kết hợp kiểm định định kỳ" },
      { name: "Phun khử trùng khu vực sản xuất", spec: "Hóa chất thực phẩm đạt chuẩn HACCP", quantity: 12, unit: "Lần/năm" },
    ],
    commercialTerms: {
      deliveryLocation: "Nhà xưởng sản xuất và kho lạnh – Nhà máy Bia Hạ Long, KCN Việt Hưng",
      deliveryTime: "Bắt đầu triển khai trong vòng 10 ngày sau ký hợp đồng; thực hiện theo lịch hàng tháng",
      paymentTerms: "Thanh toán theo tháng, trong vòng 15 ngày sau khi hoàn thành và có biên bản nghiệm thu",
      quotationRequirements: [
        "Báo giá theo đơn giá/m² và đơn giá từng hạng mục dịch vụ",
        "Hồ sơ kinh nghiệm vệ sinh nhà máy thực phẩm (tối thiểu 3 hợp đồng tương tự)",
        "Danh sách hóa chất sử dụng và chứng nhận an toàn thực phẩm HACCP",
        "Sơ đồ nhân sự và kế hoạch triển khai chi tiết",
      ],
    },
    documents: [
      { name: "Thông báo mời thầu GT-2025-008.pdf", fileType: "PDF", size: "234 KB" },
      { name: "Phạm vi công việc vệ sinh công nghiệp.pdf", fileType: "PDF", size: "387 KB" },
      { name: "Mẫu báo giá GT-2025-008.xlsx", fileType: "XLSX", size: "40 KB" },
    ],
    timeline: [
      { label: "Phát hành gói thầu", date: "10/05/2025", completed: true },
      { label: "Nhận hồ sơ báo giá", date: "20/05/2025", completed: true },
      { label: "Đóng thầu", date: "25/05/2025", completed: true },
      { label: "Đánh giá báo giá", date: "28/05/2025", completed: false },
      { label: "Công bố kết quả", date: "05/06/2025", completed: false },
    ],
  },
  {
    id: "9",
    code: "GT-2025-009",
    name: "Cung cấp vỏ lon nhôm 330ml cho dây chuyền đóng gói sản phẩm",
    category: "Nguyên vật liệu",
    inviter: "Bia Hạ Long",
    deadline: "28/05/2025",
    status: "Sắp đóng",
    value: "5.800.000.000 ₫",
    description:
      "Cung cấp vỏ lon nhôm 330ml tiêu chuẩn nội địa, số lượng 5 triệu lon/lô, in màu theo thiết kế riêng của Bia Hạ Long. Đảm bảo tiêu chuẩn an toàn thực phẩm HACCP.",
    items: [
      { name: "Vỏ lon nhôm 330ml – Bia HạLong Classic", spec: "In 4 màu theo thiết kế 2025, dung sai ±0.5mm", quantity: 3000000, unit: "Cái", note: "Đạt chuẩn HACCP" },
      { name: "Vỏ lon nhôm 330ml – Bia Hạ Long Dark", spec: "In 4 màu theo thiết kế 2025", quantity: 1000000, unit: "Cái" },
      { name: "Nắp lon nhôm Ø52mm", spec: "Đồng bộ dây chuyền đóng lon Canning Line 3", quantity: 5000000, unit: "Cái", note: "Kèm vòng gioăng chống rò" },
    ],
    commercialTerms: {
      deliveryLocation: "Kho nguyên liệu đóng gói – Nhà máy Bia Hạ Long, KCN Việt Hưng",
      deliveryTime: "60–90 ngày sau ký hợp đồng; giao 2 lô, mỗi lô khoảng 2.5 triệu cái",
      paymentTerms: "30% đặt cọc sau ký hợp đồng, 70% sau khi giao hàng và kiểm tra chất lượng đạt yêu cầu",
      quotationRequirements: [
        "Báo giá theo đơn giá/1.000 cái và giá trọn lô",
        "Chứng nhận tiêu chuẩn an toàn thực phẩm HACCP/ISO 22000",
        "Mẫu sản phẩm (500 cái/mẫu) kèm phiếu kiểm tra kích thước",
        "Phương án in ấn và file thiết kế tương thích định dạng AI/PDF",
      ],
    },
    documents: [
      { name: "Thông báo mời thầu GT-2025-009.pdf", fileType: "PDF", size: "267 KB" },
      { name: "Thiết kế lon 2025 – Classic & Dark.pdf", fileType: "PDF", size: "2.4 MB" },
      { name: "Tiêu chuẩn kỹ thuật vỏ lon nhôm.pdf", fileType: "PDF", size: "398 KB" },
      { name: "Mẫu báo giá GT-2025-009.xlsx", fileType: "XLSX", size: "46 KB" },
    ],
    timeline: [
      { label: "Phát hành gói thầu", date: "10/05/2025", completed: true },
      { label: "Nhận hồ sơ báo giá", date: "23/05/2025", completed: true },
      { label: "Đóng thầu", date: "28/05/2025", completed: false },
      { label: "Đánh giá báo giá", date: "02/06/2025", completed: false },
      { label: "Công bố kết quả", date: "10/06/2025", completed: false },
    ],
  },
  {
    id: "10",
    code: "GT-2025-011",
    name: "Cung cấp thiết bị đo nhiệt độ và áp suất chuyên dụng cho nồi hơi",
    category: "Công cụ dụng cụ",
    inviter: "Bia Hạ Long",
    deadline: "10/07/2025",
    status: "Đang mở",
    value: "95.000.000 ₫",
    description:
      "Bổ sung thiết bị đo lường cho hệ thống nồi hơi: đồng hồ đo áp suất lò hơi Wika, cảm biến nhiệt độ Pt100, van an toàn và bộ ghi dữ liệu nhiệt độ áp suất theo thời gian thực.",
    items: [
      { name: "Đồng hồ đo áp suất Wika", spec: "Dải đo 0–16 bar, kết nối 1/2\" BSP, SS316", quantity: 8, unit: "Cái", note: "Chuẩn CE, Class 1.0" },
      { name: "Cảm biến nhiệt độ Pt100", spec: "Dải đo -50 đến +200°C, kèm đầu nối M20", quantity: 6, unit: "Cái", note: "Xuất xứ châu Âu" },
      { name: "Van an toàn lò hơi", spec: "Áp suất chỉnh định 10 bar, kết nối 3/4\"", quantity: 3, unit: "Cái", note: "Chứng nhận PED 2014/68/EU" },
      { name: "Bộ ghi dữ liệu nhiệt độ–áp suất", spec: "8 kênh analog, ghi SD card, Ethernet", quantity: 2, unit: "Cái", note: "Kèm phần mềm thu thập dữ liệu" },
      { name: "Cảm biến báo mức nước nồi hơi", spec: "Điện dung, ngõ ra 4–20mA", quantity: 3, unit: "Cái" },
    ],
    commercialTerms: {
      deliveryLocation: "Phòng máy nồi hơi – Nhà máy Bia Hạ Long, KCN Việt Hưng",
      deliveryTime: "14–21 ngày làm việc sau ký hợp đồng",
      paymentTerms: "Thanh toán 100% trong vòng 30 ngày sau khi giao hàng và kiểm tra đạt yêu cầu",
      quotationRequirements: [
        "Báo giá từng hạng mục kèm thông số kỹ thuật chi tiết",
        "Chứng chỉ hiệu chuẩn và chứng nhận CE/PED khi áp dụng",
        "Chính sách bảo hành tối thiểu 12 tháng",
        "Chứng từ xuất xứ và nhập khẩu (C/O, tờ khai hải quan nếu nhập khẩu)",
      ],
    },
    documents: [
      { name: "Thông báo mời thầu GT-2025-011.pdf", fileType: "PDF", size: "223 KB" },
      { name: "Yêu cầu kỹ thuật thiết bị đo lường nồi hơi.pdf", fileType: "PDF", size: "412 KB" },
      { name: "Mẫu báo giá GT-2025-011.xlsx", fileType: "XLSX", size: "38 KB" },
    ],
    timeline: [
      { label: "Phát hành gói thầu", date: "20/06/2025", completed: true },
      { label: "Nhận hồ sơ báo giá", date: "05/07/2025", completed: true },
      { label: "Đóng thầu", date: "10/07/2025", completed: false },
      { label: "Đánh giá báo giá", date: "17/07/2025", completed: false },
      { label: "Công bố kết quả", date: "25/07/2025", completed: false },
    ],
  },
  {
    id: "11",
    code: "GT-2024-018",
    name: "Cung cấp bột malt đại mạch nhập khẩu phục vụ sản xuất năm 2025",
    category: "Nguyên vật liệu",
    inviter: "Bia Hạ Long",
    deadline: "30/11/2024",
    status: "Đã có kết quả",
    value: "12.000.000.000 ₫",
    description:
      "Cung cấp malt đại mạch loại Pilsen và Munich nhập khẩu từ Đức/Bỉ, khối lượng 400 tấn. Yêu cầu độ ẩm ≤ 4.5%, chất chiết ≥ 79%, thời gian đường hóa ≤ 15 phút.",
    items: [
      { name: "Malt đại mạch Pilsen", spec: "Chiết xuất ≥79%, độ ẩm ≤4.5%, đường hóa ≤15 phút", quantity: 250, unit: "Tấn", note: "Nhập khẩu Đức/Bỉ" },
      { name: "Malt đại mạch Munich", spec: "Màu 8–12 EBC, chiết xuất ≥77%", quantity: 100, unit: "Tấn", note: "Nhập khẩu Đức" },
      { name: "Malt đại mạch Caramel 60", spec: "Màu 58–68 EBC, chiết xuất ≥73%", quantity: 50, unit: "Tấn", note: "Nhập khẩu Bỉ" },
    ],
    commercialTerms: {
      deliveryLocation: "Kho nguyên liệu – Nhà máy Bia Hạ Long, KCN Việt Hưng (có bãi container)",
      deliveryTime: "60–90 ngày sau ký hợp đồng (vận chuyển đường biển từ châu Âu)",
      paymentTerms: "L/C at sight hoặc T/T: 30% trước khi giao hàng tại cảng xuất, 70% sau khi nhận Bill of Lading",
      quotationRequirements: [
        "Báo giá CIF cảng Hải Phòng theo từng chủng loại malt",
        "Certificate of Analysis (CoA) từ nhà sản xuất, tối thiểu 3 mẻ gần nhất",
        "Phiếu kiểm tra EBC, độ ẩm, độ chiết xuất và thời gian đường hóa",
        "Phương án bao bì (bao giấy 25kg hoặc container bulk) và điều kiện bảo quản trong vận chuyển",
      ],
    },
    documents: [
      { name: "Thông báo mời thầu GT-2024-018.pdf", fileType: "PDF", size: "298 KB" },
      { name: "Tiêu chuẩn kỹ thuật malt nhập khẩu.pdf", fileType: "PDF", size: "564 KB" },
      { name: "Mẫu báo giá và điều kiện thương mại GT-2024-018.xlsx", fileType: "XLSX", size: "58 KB" },
    ],
    timeline: [
      { label: "Phát hành gói thầu", date: "01/11/2024", completed: true },
      { label: "Nhận hồ sơ báo giá", date: "20/11/2024", completed: true },
      { label: "Đóng thầu", date: "30/11/2024", completed: true },
      { label: "Đánh giá báo giá", date: "10/12/2024", completed: true },
      { label: "Công bố kết quả", date: "20/12/2024", completed: true },
    ],
  },
  {
    id: "12",
    code: "GT-2024-015",
    name: "Dịch vụ kiểm định an toàn thiết bị áp lực và nồi hơi định kỳ",
    category: "Dịch vụ phụ trợ",
    inviter: "Bia Hạ Long",
    deadline: "15/10/2024",
    status: "Đã có kết quả",
    value: "180.000.000 ₫",
    description:
      "Kiểm định định kỳ theo nghị định 44/2016/NĐ-CP cho 08 bình chứa khí áp lực, 03 nồi hơi đốt dầu và hệ thống đường ống áp lực. Đơn vị kiểm định phải được Bộ LĐTBXH cấp phép.",
    items: [
      { name: "Kiểm định bình chứa khí áp lực", spec: "Theo NĐ 44/2016, áp suất 8–12 bar", quantity: 8, unit: "Bình", note: "Kèm cấp phát biên bản kiểm định" },
      { name: "Kiểm định nồi hơi đốt dầu", spec: "Công suất 1–3 tấn hơi/h", quantity: 3, unit: "Nồi", note: "Gồm thử áp và kiểm tra van an toàn" },
      { name: "Kiểm định hệ thống đường ống áp lực", spec: "Tổng chiều dài ~200m, đường kính 25–100mm", quantity: 1, unit: "Lô", note: "Theo ASME B31.3" },
    ],
    commercialTerms: {
      deliveryLocation: "Nhà máy Bia Hạ Long, KCN Việt Hưng – phòng máy và khu nồi hơi",
      deliveryTime: "Thực hiện trong 3 ngày liên tục sau khi thống nhất lịch với nhà máy",
      paymentTerms: "Thanh toán 100% trong vòng 15 ngày sau khi bàn giao hồ sơ kiểm định và biên bản",
      quotationRequirements: [
        "Báo giá theo từng hạng mục thiết bị cần kiểm định",
        "Giấy phép hoạt động kiểm định do Bộ LĐTBXH cấp (còn hiệu lực)",
        "Danh sách kiểm định viên có chứng chỉ hành nghề",
        "Phương án kiểm định chi tiết và mẫu biên bản kết quả",
      ],
    },
    documents: [
      { name: "Thông báo mời thầu GT-2024-015.pdf", fileType: "PDF", size: "187 KB" },
      { name: "Danh sách thiết bị cần kiểm định.pdf", fileType: "PDF", size: "234 KB" },
      { name: "Mẫu báo giá GT-2024-015.xlsx", fileType: "XLSX", size: "32 KB" },
    ],
    timeline: [
      { label: "Phát hành gói thầu", date: "01/10/2024", completed: true },
      { label: "Nhận hồ sơ báo giá", date: "10/10/2024", completed: true },
      { label: "Đóng thầu", date: "15/10/2024", completed: true },
      { label: "Đánh giá báo giá", date: "20/10/2024", completed: true },
      { label: "Công bố kết quả", date: "28/10/2024", completed: true },
    ],
  },
  {
    id: "13",
    code: "GT-2024-021",
    name: "Cung cấp hệ thống máy lọc nước RO công suất 50m³/h cho nhà máy",
    category: "Máy móc",
    inviter: "Bia Hạ Long",
    deadline: "20/12/2024",
    status: "Đã đóng",
    value: "3.200.000.000 ₫",
    description:
      "Thiết kế, cung cấp và lắp đặt hệ thống xử lý nước RO công suất 50 m³/h đạt tiêu chuẩn nước sản xuất bia theo TCVN 6096:2004. Bao gồm tiền lọc, RO, khử trùng UV và bồn lưu trữ 200m³.",
    items: [
      { name: "Hệ thống tiền lọc (Pre-treatment)", spec: "Lọc cát, carbon, làm mềm; công suất 50m³/h; vỏ Inox 304", quantity: 1, unit: "Bộ" },
      { name: "Màng lọc RO", spec: "Membrane 8040, loại bỏ muối ≥98%, công suất 50m³/h", quantity: 1, unit: "Hệ thống" },
      { name: "Bộ trao đổi áp lực ERD", spec: "Tiết kiệm năng lượng ≥65% so với RO thông thường", quantity: 1, unit: "Bộ" },
      { name: "Bồn chứa nước RO", spec: "Inox 316L, dung tích 200m³, kèm cảm biến mức", quantity: 1, unit: "Bộ", note: "Chứng nhận tiêu chuẩn nước thực phẩm" },
      { name: "Hệ thống khử trùng UV", spec: "Công suất 50m³/h, đèn UV germicidal 254nm", quantity: 1, unit: "Bộ" },
      { name: "Bộ điều khiển PLC và SCADA", spec: "Màn hình HMI 15\", Modbus TCP, lưu trữ dữ liệu 1 năm", quantity: 1, unit: "Bộ" },
    ],
    commercialTerms: {
      deliveryLocation: "Khu xử lý nước – Nhà máy Bia Hạ Long, KCN Việt Hưng",
      deliveryTime: "90–120 ngày sau ký hợp đồng; vận hành thử nghiệm 14 ngày trước nghiệm thu chính thức",
      paymentTerms: "30% đặt cọc sau ký hợp đồng, 60% sau lắp đặt hoàn chỉnh, 10% sau nghiệm thu 30 ngày vận hành ổn định",
      quotationRequirements: [
        "Báo giá trọn gói thiết kế, cung cấp, lắp đặt và vận hành thử nghiệm",
        "P&ID sơ bộ và layout mặt bằng đề xuất",
        "Phương án đào tạo vận hành cho 3 kỹ sư vận hành",
        "Chứng nhận NSF/ANSI hoặc tương đương cho vật liệu tiếp xúc nước",
      ],
    },
    documents: [
      { name: "Thông báo mời thầu GT-2024-021.pdf", fileType: "PDF", size: "356 KB" },
      { name: "Yêu cầu kỹ thuật hệ thống RO 50m3h.pdf", fileType: "PDF", size: "892 KB" },
      { name: "Tiêu chuẩn nước sản xuất bia TCVN 6096-2004.pdf", fileType: "PDF", size: "234 KB" },
      { name: "Mẫu báo giá GT-2024-021.xlsx", fileType: "XLSX", size: "64 KB" },
    ],
    timeline: [
      { label: "Phát hành gói thầu", date: "01/12/2024", completed: true },
      { label: "Nhận hồ sơ báo giá", date: "13/12/2024", completed: true },
      { label: "Đóng thầu", date: "20/12/2024", completed: true },
      { label: "Đánh giá báo giá", date: "28/12/2024", completed: false },
      { label: "Công bố kết quả", date: "10/01/2025", completed: false },
    ],
  },
];

export const stats = [
  { label: "Gói thầu đang mở", value: "24" },
  { label: "Nhà cung cấp đã đăng ký", value: "1.280" },
  { label: "Nhóm hàng mua sắm", value: "18" },
  { label: "Tổng giá trị mời thầu", value: "48 tỷ ₫" },
];

export const categories = [
  { name: "Nguyên vật liệu", count: 8 },
  { name: "Máy móc", count: 5 },
  { name: "Thiết bị", count: 6 },
  { name: "Công cụ dụng cụ", count: 4 },
  { name: "Dịch vụ phụ trợ", count: 3 },
];

export const processSteps = [
  {
    title: "Đăng ký nhà cung cấp",
    description:
      "Tạo tài khoản và hoàn thiện hồ sơ năng lực của doanh nghiệp trên hệ thống.",
  },
  {
    title: "Xem gói thầu phù hợp",
    description:
      "Tìm kiếm và theo dõi các gói thầu phù hợp theo nhóm hàng và quy mô.",
  },
  {
    title: "Nộp báo giá / hồ sơ",
    description:
      "Tải lên hồ sơ năng lực và nộp báo giá trực tuyến trước hạn quy định.",
  },
  {
    title: "Nhận kết quả lựa chọn",
    description:
      "Theo dõi kết quả đánh giá và nhận thông báo kết quả lựa chọn nhà cung cấp.",
  },
];

export const benefits = [
  {
    title: "Tiếp cận nhu cầu mua sắm minh bạch",
    description:
      "Xem đầy đủ yêu cầu kỹ thuật, điều kiện tham gia và tiêu chí đánh giá ngay từ đầu.",
  },
  {
    title: "Theo dõi gói thầu dễ dàng",
    description:
      "Bảng điều khiển trực quan giúp quản lý tất cả gói thầu đang tham gia một chỗ.",
  },
  {
    title: "Nộp báo giá trực tuyến",
    description:
      "Tải lên hồ sơ và nộp báo giá trực tuyến, không cần đến trực tiếp hay gửi bưu phẩm.",
  },
  {
    title: "Nhận thông báo và kết quả rõ ràng",
    description:
      "Nhận thông báo qua email khi có gói thầu mới và kết quả đánh giá được công bố.",
  },
];
