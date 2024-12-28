export interface Catering {
  id: string;
  expectedPax: number;
  totalAmount: number;
  numberOfMainDishes: number;
  eventId: string;
  packageId: string;
  mainDishPackage: string;
  mainDishes: MainDish[];
  snackCorner: SnackCorner[];
  addOns: AddOn[];
}

export interface MainDish {
  id: string;
  name: string;
  dishType: string;
  category: string;
  description: string;
}

export interface SnackCorner {
  id: string;
  name: string;
  category: string;
  description: string;
}

export interface AddOn {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  paxCapacity: number;
  serviceHours: string;
}

export interface MainDishPackage {
  id: string;
  name: string;
  numOfDishesCategory: number;
  price: number;
  minPax: number;
  maxPax: number;
}

export interface Package {
  id: string;
  title: string;
  description: string;
}

export interface Inclusion {
  id: string;
  name: string;
  description: string;
}

export interface CateringContextType {
  expectedPax: number;
  setExpectedPax: (expectedPax: number) => void;
  totalAmount: number;
  setTotalAmount: (totalAmount: number) => void;
  maxDishes: number;
  setMaxDishes: (maxDishes: number) => void;
  selectedDishes: string[];
  setSelectedDishes: (selectedDishes: string[]) => void;
  numberOfMainDishes: number;
  setNumberOfMainDishes: (numberOfMainDishes: number) => void;
  selectedPackage: MainDishPackage | null;
  setSelectedPackage: (selectedPackage: MainDishPackage | null) => void;
  drinks: string[];
  setDrinks: (drinks: string[]) => void;
  desserts: string[];
  setDesserts: (desserts: string[]) => void;
  pastas: string[];
  setPastas: (pastas: string[]) => void;
  sandwiches: string[];
  setSandwiches: (sandwiches: string[]) => void;
  fruits: string[];
  setFruits: (fruits: string[]) => void;
  salad: string[];
  setSalad: (salad: string[]) => void;
  foodCarts: AddOn[];
  setFoodCarts: (foodCarts: AddOn[]) => void;
  technicals: AddOn[];
  setTechnicals: (technicals: AddOn[]) => void;
  mainDishPackages: MainDishPackage[];
  setMainDishPackages: (mainDishPackages: MainDishPackage[]) => void;
  packageDetails: Package[];
  setPackageDetails: (packageDetails: Package[]) => void;
  inclusions: Inclusion[];
  setInclusions: (inclusions: Inclusion[]) => void;
  mainDishes: MainDish[];
  setMainDishes: (mainDishes: MainDish[]) => void;
  snackCorners: SnackCorner[];
  setSnackCorners: (snackCorners: SnackCorner[]) => void;
  addOns: AddOn[];
  setAddOns: (addOns: AddOn[]) => void;
}
