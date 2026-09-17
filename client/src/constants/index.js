import {
  Book,
  Calendar,
  Clock,
  DownloadSimple as Download,
  FileText,
  GraduationCap,
  Books as Library,
  MagnifyingGlass as Search,
  Plant as Wheat,
  Flask as FlaskConical,
  Building as Building2,
  Cpu,
  Lightning as Zap,
  ForkKnife as UtensilsCrossed,
  Gear as Cog,
  GasCan as Fuel,
} from "@phosphor-icons/react"

export * from "./branding"

export const departments=[
    {
        id: "agricultural",
        name: "Agricultural Engineering",
        shortName: "AGE",
        slug: "agricultural-engineering",
        icon: Wheat,
        color: "bg-green-500",
        description: "Agricultural Engineering applies engineering principles to agricultural production, processing, and sustainability challenges. It focuses on improving farm machinery, irrigation systems, and sustainable food production methods.",
        functions: [
          "Design and development of farm machinery and equipment",
          "Soil and water conservation engineering",
          "Irrigation and drainage systems design",
          "Post-harvest processing and storage systems",
          "Agricultural waste management and bioenergy",
          "Precision agriculture and automation",
          "Environmental impact assessment for agricultural projects"
        ],
        careerPaths: [
          "Agricultural Equipment Designer",
          "Irrigation Engineer",
          "Farm Operations Manager",
          "Agricultural Consultant",
          "Food Processing Engineer",
          "Environmental Engineer"
        ],
        associationName: "AESA - Agricultural Engineering Students Association",
    },
    {
        id: "chemical",
        name: "Chemical Engineering",
        shortName: "CHE",
        slug: "chemical-engineering",
        icon: FlaskConical,
        color: "bg-purple-500",
        description: "Chemical Engineering focuses on designing and developing chemical processes and equipment to transform raw materials into valuable products. It combines chemistry, physics, biology, and mathematics to solve problems in manufacturing and production.",
        functions: [
          "Process design and optimization for chemical plants",
          "Development of petroleum refining processes",
          "Pharmaceutical manufacturing and drug delivery systems",
          "Environmental protection and pollution control",
          "Materials synthesis and processing",
          "Energy conversion and storage systems",
          "Biochemical and biotechnology processes"
        ],
        careerPaths: [
          "Process Engineer",
          "Petroleum Engineer",
          "Pharmaceutical Engineer",
          "Environmental Engineer",
          "Materials Scientist",
          "Quality Control Engineer"
        ],
        associationName: "SCSoN - Student's Chemical Society of Nigeria",
    },
    {
        id: "civil",
        name: "Civil Engineering",
        shortName: "CVE",
        slug: "civil-engineering",
        icon: Building2,
        color: "bg-orange-500",
        description: "Civil Engineering deals with the design, construction, and maintenance of the physical and naturally built environment. This includes infrastructure such as roads, bridges, buildings, dams, and water supply systems.",
        functions: [
          "Structural analysis and design of buildings and bridges",
          "Transportation systems planning and design",
          "Water resources and hydraulic engineering",
          "Geotechnical engineering and foundation design",
          "Construction project management",
          "Urban planning and development",
          "Environmental engineering and sustainability"
        ],
        careerPaths: [
          "Structural Engineer",
          "Transportation Engineer",
          "Construction Manager",
          "Geotechnical Engineer",
          "Water Resources Engineer",
          "Urban Planner"
        ],
        associationName: "NICE - Nigerian Institution of Civil Engineers",
    },
    {
        id:"computer",
        name:"Computer Engineering",
        shortName:"CPE",
        slug: "computer-engineering",
        icon: Cpu,
        color: "bg-blue-500",
        description: "Computer Engineering combines electrical engineering and computer science to develop computer hardware and software systems. It focuses on the design of computing devices, embedded systems, and the integration of hardware with software.",
        functions: [
          "Design and development of computer hardware systems",
          "Embedded systems and IoT device development",
          "Software engineering and application development",
          "Network architecture and cybersecurity",
          "Artificial intelligence and machine learning systems",
          "Digital signal processing",
          "Computer architecture and microprocessor design"
        ],
        careerPaths: [
          "Software Engineer",
          "Hardware Engineer",
          "Embedded Systems Developer",
          "Network Engineer",
          "Cybersecurity Specialist",
          "AI/ML Engineer"
        ],
        associationName: "ACES - Association of Computer Engineering Students",
    },
    {
        id: "electrical",
        name: "Electrical and Electronics Engineering",
        shortName: "ELE",
        slug: "electrical-electronic-engineering",
        icon: Zap,
        color: "bg-yellow-500",
        description: "Electrical and Electronics Engineering focuses on electrical systems, electronic devices, and electromagnetic applications. It covers power generation, transmission, and the design of electronic circuits and communication systems.",
        functions: [
          "Power generation and distribution systems",
          "Electronic circuit design and analysis",
          "Telecommunications and signal processing",
          "Control systems and automation",
          "Renewable energy systems",
          "Instrumentation and measurement",
          "Power electronics and drives"
        ],
        careerPaths: [
          "Power Systems Engineer",
          "Electronics Design Engineer",
          "Telecommunications Engineer",
          "Control Systems Engineer",
          "Renewable Energy Specialist",
          "Automation Engineer"
        ],
        associationName: "NIEEE - The Nigerian Institute of Electrical and Electronics Engineers",
    },
    {
        id: "food",
        name: "Food Engineering",
        shortName: "FDE",
        slug: "food-engineering",
        icon: UtensilsCrossed,
        color: "bg-red-500",
        description: "Food Engineering applies engineering principles to food production, processing, preservation, and packaging systems. It ensures food safety, quality, and extends shelf life while maintaining nutritional value.",
        functions: [
          "Food processing and preservation technology",
          "Food packaging and storage systems",
          "Quality control and food safety management",
          "Food plant design and equipment selection",
          "Nutritional analysis and fortification",
          "Waste management in food industries",
          "Development of new food products"
        ],
        careerPaths: [
          "Food Process Engineer",
          "Quality Assurance Manager",
          "Food Safety Specialist",
          "Product Development Engineer",
          "Food Plant Manager",
          "Regulatory Affairs Specialist"
        ],
        associationName: "AFES - Association of Food Engineering Students",
    },
    {
        id: "mechanical",
        name: "Mechanical Engineering",
        shortName: "MEE",
        slug: "mechanical-engineering",
        icon: Cog,
        color: "bg-gray-500",
        description: "Mechanical Engineering involves designing, analyzing, and manufacturing mechanical systems and thermal devices. It is one of the broadest engineering disciplines, covering everything from automotive to aerospace systems.",
        functions: [
          "Design and analysis of mechanical systems",
          "Thermodynamics and heat transfer applications",
          "Manufacturing processes and automation",
          "Automotive and aerospace engineering",
          "HVAC systems design",
          "Robotics and mechatronics",
          "Materials science and engineering"
        ],
        careerPaths: [
          "Mechanical Design Engineer",
          "Manufacturing Engineer",
          "Automotive Engineer",
          "HVAC Engineer",
          "Robotics Engineer",
          "Maintenance Engineer"
        ],
        associationName: "NIMechE - The Nigerian Institution for Mechanical Engineers",
    },
    {
        id: "petroleum",
        name: "Petroleum Engineering",
        shortName: "PEE",
        slug: "petroleum-engineering",
        icon: Fuel,
        color: "bg-amber-700",
        description: "Petroleum Engineering specializes in the exploration, extraction, and production of oil, gas, and other hydrocarbon resources from the earth. It combines geology, physics, and chemistry to optimize resource recovery.",
        functions: [
          "Reservoir engineering and management",
          "Drilling engineering and well design",
          "Production engineering and optimization",
          "Enhanced oil recovery techniques",
          "Natural gas processing and transportation",
          "Petroleum economics and project evaluation",
          "Health, safety, and environmental management"
        ],
        careerPaths: [
          "Reservoir Engineer",
          "Drilling Engineer",
          "Production Engineer",
          "Petroleum Geologist",
          "Field Operations Manager",
          "HSE Specialist"
        ],
        associationName: "NIPE - The Nigerian Institute of Petroleum Engineers",
    }
]

export const levels=[100,200,300,400,500]

export const semesters=[{
    id: "1st",
    name: "First Semester",
},
{
    id: "2nd",
    name: "Second Semester",
},
]

export const bookCategories={
    textBook: "Textbooks",
    pastQuestion: "Past Questions",
    lectureNote: "Lecture Notes",
}
export const steps = [
    {
      number: 1,
      title: "Select Your Department, Level and Semester",
      description:
        "Choose your engineering department,current academic level and which semester you're interested in from the dropdown menu to filter courses specific to your chouce.",
    image: "/289_1x_shots_so.png",
    },
    {
      number: 2,
      title: "Find the course",
      description: "Look for the course you are interested to get its materials",
      image: "/928_1x_shots_so.png",
    },
    {
      number: 3,
      title: "Find the material",
      description: "Look for the material in which you needm you can filter by Textbooks, Past questions or Lecture notes",
      image: "/715_1x_shots_so.png",
    },
    {
      number: 4,
      title: "Preview and Download Material",
      description:
        "You can have a preview of the material's contents before proceeding to download",
      image: "/266_1x_shots_so.png",
    },
  ]

export const features = [
    // {
    //   icon: Book,
    //   title: "Extensive Collection",
    //   description: "Access thousands of engineering textbooks, journals, and research papers across all disciplines.",
    // },
    {
      icon: Search,
      title: "Advanced Search",
      description:
        "Find exactly what you need with our powerful search tools that filter by department, level, and semester.",
    },
    {
      icon: Download,
      title: "Digital Downloads",
      description: "Download past questions, lecture notes... directly to your device for offline access.",
    },
    // {
    //   icon: Calendar,
    //   title: "Course Calendar",
    //   description: "Stay organized with integrated course schedules, assignment due dates, and exam timelines.",
    // },
    {
      icon: FileText,
      title: "Lecture Notes",
      description: "Access comprehensive lecture notes and supplementary materials for all engineering courses.",
    },
    {
      icon: Clock,
      title: "24/7 Access",
      description: "Our digital library is available around the clock, allowing you to study whenever it suits you.",
    },
    // {
    //   icon: GraduationCap,
    //   title: "Academic Support",
    //   description: "Get assistance from faculty members and teaching assistants through our integrated support system.",
    // },
    // {
    //   icon: Library,
    //   title: "Study Resources",
    //   description: "Access past exams, practice problems, and study guides to help you prepare for assessments.",
    // },
  ]
