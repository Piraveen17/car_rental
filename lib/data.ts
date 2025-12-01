import type { Car, User, Booking, Maintenance, DemoPayment } from "@/types";

// Demo Users
export const users: User[] = [
  {
    id: "user-1",
    name: "Admin User",
    email: "Piraveen1727@gmail.com",
    phone: "+1234567890",
    role: "admin",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "user-2",
    name: "John Doe",
    email: "john@example.com",
    phone: "+1987654321",
    nicPassport: "P123456789",
    role: "customer",
    isActive: true,
    createdAt: new Date("2024-02-15"),
    updatedAt: new Date("2024-02-15"),
  },
  {
    id: "user-3",
    name: "Jane Smith",
    email: "jane@example.com",
    phone: "+1122334455",
    nicPassport: "N987654321",
    role: "customer",
    isActive: true,
    createdAt: new Date("2024-03-10"),
    updatedAt: new Date("2024-03-10"),
  },
  {
    id: "user-4",
    name: "Bob Wilson",
    email: "bob@example.com",
    role: "customer",
    isActive: false,
    createdAt: new Date("2024-04-01"),
    updatedAt: new Date("2024-04-01"),
  },
];

// Demo Cars
export const cars: Car[] = [
  {
    id: "car-1",
    make: "Toyota",
    carModel: "Camry",
    year: 2024,
    pricePerDay: 75,
    transmission: "automatic",
    seats: 5,
    fuelType: "Hybrid",
    images: [
      "/toyota-camry-2024-silver-sedan.jpg",
      "/toyota-camry-interior-dashboard.jpg",
      "/toyota-camry-rear.png",
    ],
    features: [
      "Bluetooth",
      "Backup Camera",
      "Lane Departure Warning",
      "Adaptive Cruise Control",
      "Apple CarPlay",
    ],
    location: "New York",
    status: "active",
    description:
      "The Toyota Camry is a reliable and fuel-efficient sedan perfect for business trips or family outings.",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "car-2",
    make: "BMW",
    carModel: "X5",
    year: 2024,
    pricePerDay: 150,
    transmission: "automatic",
    seats: 7,
    fuelType: "Gasoline",
    images: [
      "/bmw-x5-2024-black-luxury-suv.jpg",
      "/bmw-x5-interior-leather-seats.jpg",
      "/bmw-x5-side-profile.jpg",
    ],
    features: [
      "Panoramic Sunroof",
      "Premium Sound System",
      "Heated Seats",
      "Navigation",
      "360 Camera",
      "Wireless Charging",
    ],
    location: "Los Angeles",
    status: "active",
    description:
      "Experience luxury and performance with the BMW X5. Perfect for those who demand the best.",
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-01"),
  },
  {
    id: "car-3",
    make: "Honda",
    carModel: "Civic",
    year: 2023,
    pricePerDay: 55,
    transmission: "manual",
    seats: 5,
    fuelType: "Gasoline",
    images: [
      "/honda-civic-2023-red-sporty.jpg",
      "/honda-civic-interior-modern.jpg",
      "/honda-civic-rear-angle.jpg",
    ],
    features: ["Bluetooth", "USB Ports", "Backup Camera", "Honda Sensing"],
    location: "Chicago",
    status: "active",
    description:
      "The Honda Civic offers great fuel economy and a fun driving experience.",
    createdAt: new Date("2024-02-15"),
    updatedAt: new Date("2024-02-15"),
  },
  {
    id: "car-4",
    make: "Tesla",
    carModel: "Model 3",
    year: 2024,
    pricePerDay: 120,
    transmission: "automatic",
    seats: 5,
    fuelType: "Electric",
    images: [
      "/tesla-model-3-2024-white-electric-car.jpg",
      "/tesla-model-3-minimalist-interior.jpg",
      "/tesla-model-3-charging.jpg",
    ],
    features: [
      "Autopilot",
      "Full Self-Driving Capability",
      "Premium Interior",
      "Glass Roof",
      "Supercharger Access",
    ],
    location: "San Francisco",
    status: "active",
    description:
      "Go electric with the Tesla Model 3. Zero emissions with cutting-edge technology.",
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2024-03-01"),
  },
  {
    id: "car-5",
    make: "Mercedes-Benz",
    carModel: "E-Class",
    year: 2024,
    pricePerDay: 180,
    transmission: "automatic",
    seats: 5,
    fuelType: "Gasoline",
    images: [
      "/mercedes-e-class-2024-black-luxury-sedan.jpg",
      "/mercedes-e-class-interior-premium.jpg",
      "/mercedes-e-class-exterior-elegant.jpg",
    ],
    features: [
      "MBUX System",
      "Burmester Sound",
      "Air Suspension",
      "Massage Seats",
      "Ambient Lighting",
    ],
    location: "Miami",
    status: "active",
    description:
      "The epitome of luxury and sophistication. The Mercedes E-Class delivers an unparalleled driving experience.",
    createdAt: new Date("2024-03-15"),
    updatedAt: new Date("2024-03-15"),
  },
  {
    id: "car-6",
    make: "Ford",
    carModel: "Mustang",
    year: 2024,
    pricePerDay: 130,
    transmission: "manual",
    seats: 4,
    fuelType: "Gasoline",
    images: [
      "/ford-mustang-2024-red-sports-car.jpg",
      "/ford-mustang-interior-sporty.jpg",
      "/placeholder.svg?height=400&width=600",
    ],
    features: [
      "V8 Engine",
      "Performance Package",
      "Track Apps",
      "Premium Audio",
      "Sport Seats",
    ],
    location: "Las Vegas",
    status: "active",
    description:
      "Feel the power of the iconic Ford Mustang. Perfect for those who love performance.",
    createdAt: new Date("2024-04-01"),
    updatedAt: new Date("2024-04-01"),
  },
  {
    id: "car-7",
    make: "Jeep",
    carModel: "Wrangler",
    year: 2023,
    pricePerDay: 110,
    transmission: "automatic",
    seats: 5,
    fuelType: "Gasoline",
    images: [
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
    ],
    features: [
      "4x4",
      "Removable Top",
      "Trail Rated",
      "Waterproof Interior",
      "Off-Road Tires",
    ],
    location: "Denver",
    status: "active",
    description:
      "Adventure awaits with the Jeep Wrangler. Go anywhere, do anything.",
    createdAt: new Date("2024-04-15"),
    updatedAt: new Date("2024-04-15"),
  },
  {
    id: "car-8",
    make: "Audi",
    carModel: "A4",
    year: 2024,
    pricePerDay: 95,
    transmission: "automatic",
    seats: 5,
    fuelType: "Gasoline",
    images: [
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
    ],
    features: [
      "Virtual Cockpit",
      "Quattro AWD",
      "Bang & Olufsen Audio",
      "Matrix LED Lights",
    ],
    location: "Boston",
    status: "maintenance",
    description:
      "German engineering at its finest. The Audi A4 combines performance with luxury.",
    createdAt: new Date("2024-05-01"),
    updatedAt: new Date("2024-05-01"),
  },
  {
    id: "car-9",
    make: "Chevrolet",
    carModel: "Tahoe",
    year: 2024,
    pricePerDay: 140,
    transmission: "automatic",
    seats: 8,
    fuelType: "Gasoline",
    images: [
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
    ],
    features: [
      "Third Row Seating",
      "Towing Package",
      "Rear Entertainment",
      "Power Liftgate",
    ],
    location: "Houston",
    status: "active",
    description:
      "Perfect for large families or groups. The Tahoe offers space, comfort, and capability.",
    createdAt: new Date("2024-05-15"),
    updatedAt: new Date("2024-05-15"),
  },
  {
    id: "car-10",
    make: "Porsche",
    carModel: "911",
    year: 2024,
    pricePerDay: 350,
    transmission: "automatic",
    seats: 2,
    fuelType: "Gasoline",
    images: [
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
      "/placeholder.svg?height=400&width=600",
    ],
    features: [
      "Sport Chrono Package",
      "PASM",
      "Ceramic Brakes",
      "Sport Exhaust",
      "PDK Transmission",
    ],
    location: "Los Angeles",
    status: "inactive",
    description: "The legendary Porsche 911. An icon of automotive excellence.",
    createdAt: new Date("2024-06-01"),
    updatedAt: new Date("2024-06-01"),
  },
];

// Demo Bookings
export const bookings: Booking[] = [
  {
    id: "booking-1",
    userId: "user-2",
    carId: "car-1",
    startDate: new Date("2024-11-25"),
    endDate: new Date("2024-11-28"),
    totalAmount: 225,
    paymentStatus: "paid",
    bookingStatus: "confirmed",
    invoiceUrl: "/invoices/invoice-1.pdf",
    createdAt: new Date("2024-11-20"),
    updatedAt: new Date("2024-11-20"),
  },
  {
    id: "booking-2",
    userId: "user-3",
    carId: "car-2",
    startDate: new Date("2024-12-01"),
    endDate: new Date("2024-12-05"),
    totalAmount: 600,
    paymentStatus: "paid",
    bookingStatus: "confirmed",
    invoiceUrl: "/invoices/invoice-2.pdf",
    createdAt: new Date("2024-11-25"),
    updatedAt: new Date("2024-11-25"),
  },
  {
    id: "booking-3",
    userId: "user-2",
    carId: "car-4",
    startDate: new Date("2024-12-10"),
    endDate: new Date("2024-12-15"),
    totalAmount: 600,
    paymentStatus: "pending",
    bookingStatus: "pending_payment",
    createdAt: new Date("2024-11-28"),
    updatedAt: new Date("2024-11-28"),
  },
  {
    id: "booking-4",
    userId: "user-3",
    carId: "car-6",
    startDate: new Date("2024-10-15"),
    endDate: new Date("2024-10-18"),
    totalAmount: 390,
    paymentStatus: "paid",
    bookingStatus: "completed",
    invoiceUrl: "/invoices/invoice-4.pdf",
    createdAt: new Date("2024-10-10"),
    updatedAt: new Date("2024-10-18"),
  },
  {
    id: "booking-5",
    userId: "user-2",
    carId: "car-5",
    startDate: new Date("2024-09-01"),
    endDate: new Date("2024-09-03"),
    totalAmount: 360,
    paymentStatus: "paid",
    bookingStatus: "completed",
    invoiceUrl: "/invoices/invoice-5.pdf",
    createdAt: new Date("2024-08-28"),
    updatedAt: new Date("2024-09-03"),
  },
];

// Demo Maintenance Records
export const maintenanceRecords: Maintenance[] = [
  {
    id: "maint-1",
    carId: "car-8",
    issue: "Brake pad replacement",
    cost: 450,
    date: new Date("2024-11-20"),
    status: "pending",
    createdAt: new Date("2024-11-20"),
    updatedAt: new Date("2024-11-20"),
  },
  {
    id: "maint-2",
    carId: "car-1",
    issue: "Oil change and tire rotation",
    cost: 150,
    date: new Date("2024-11-01"),
    status: "fixed",
    createdAt: new Date("2024-11-01"),
    updatedAt: new Date("2024-11-02"),
  },
  {
    id: "maint-3",
    carId: "car-3",
    issue: "AC repair",
    cost: 320,
    date: new Date("2024-10-15"),
    status: "fixed",
    createdAt: new Date("2024-10-15"),
    updatedAt: new Date("2024-10-17"),
  },
];

// Demo Payments
export const demoPayments: DemoPayment[] = [
  {
    id: "payment-1",
    bookingId: "booking-1",
    paymentId: "demo-pay-001",
    amount: 225,
    status: "paid",
    createdAt: new Date("2024-11-20"),
  },
  {
    id: "payment-2",
    bookingId: "booking-2",
    paymentId: "demo-pay-002",
    amount: 600,
    status: "paid",
    createdAt: new Date("2024-11-25"),
  },
];

// Helper functions
export function getCarById(id: string): Car | undefined {
  return cars.find((car) => car.id === id);
}

export function getUserById(id: string): User | undefined {
  return users.find((user) => user.id === id);
}

export function getBookingById(id: string): Booking | undefined {
  return bookings.find((booking) => booking.id === id);
}

export function getBookingsForUser(userId: string): Booking[] {
  return bookings.filter((booking) => booking.userId === userId);
}

export function getBookingsForCar(carId: string): Booking[] {
  return bookings.filter((booking) => booking.carId === carId);
}

export function getMaintenanceForCar(carId: string): Maintenance[] {
  return maintenanceRecords.filter((record) => record.carId === carId);
}

export function isCarAvailable(
  carId: string,
  startDate: Date,
  endDate: Date
): boolean {
  const car = getCarById(carId);
  if (!car || car.status !== "active") return false;

  const conflictingBookings = bookings.filter((booking) => {
    if (booking.carId !== carId) return false;
    if (booking.bookingStatus === "cancelled") return false;

    const bookingStart = new Date(booking.startDate);
    const bookingEnd = new Date(booking.endDate);

    return startDate <= bookingEnd && endDate >= bookingStart;
  });

  return conflictingBookings.length === 0;
}

export function calculateTotalAmount(
  pricePerDay: number,
  startDate: Date,
  endDate: Date
): number {
  const days = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  return days * pricePerDay;
}

export function getUniqueMakes(): string[] {
  return [...new Set(cars.map((car) => car.make))];
}

export function getUniqueLocations(): string[] {
  return [...new Set(cars.map((car) => car.location))];
}
