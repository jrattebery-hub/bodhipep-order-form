// app/data/products.ts

export type Product = {
    code: string;
    name: string;
    price: number;
    unit: string;
    category: string;
  };
  
  export const PRODUCT_CATALOG: Product[] = [
    // -------- GLP-1 Peptides --------
    { code: "RT10", name: "Retatrutide 10mg", price: 70, unit: "per vial", category: "GLP-1 Peptides" },
    { code: "RT15", name: "Retatrutide 15mg", price: 85, unit: "per vial", category: "GLP-1 Peptides" },
    { code: "RT20", name: "Retatrutide 20mg", price: 100, unit: "per vial", category: "GLP-1 Peptides" },
    { code: "RT30", name: "Retatrutide 30mg", price: 120, unit: "per vial", category: "GLP-1 Peptides" },
    { code: "CG05", name: "Cagrilintide 5mg", price: 35, unit: "per vial", category: "GLP-1 Peptides" },
    { code: "CG10", name: "Cagrilintide 10mg", price: 60, unit: "per vial", category: "GLP-1 Peptides" },
  
    // -------- Bulk Orders --------
    { code: "TSK10", name: "Tirzepatide 10-vial kit (special order)", price: 0, unit: "per kit", category: "Bulk Orders" },
    { code: "SMK10", name: "Semaglutide 10-vial kit (special order)", price: 0, unit: "per kit", category: "Bulk Orders" },
  
    // -------- Wellness Peptides --------
    { code: "GL70", name: "Glow70 (50mg GHK-Cu + 10mg BPC-157 + 10mg TB-500)", price: 85, unit: "per vial", category: "Wellness Peptides" },
    { code: "BB20", name: "BPC-157 (10mg) + TB-500 (10mg)", price: 70, unit: "per kit", category: "Wellness Peptides" },
    { code: "BC10", name: "BPC-157 10mg", price: 25, unit: "per vial", category: "Wellness Peptides" },
    { code: "TB10", name: "TB-500 10mg", price: 45, unit: "per vial", category: "Wellness Peptides" },
    { code: "NAD5", name: "NAD+ 500mg", price: 40, unit: "per vial", category: "Wellness Peptides" },
    { code: "ET10", name: "Epithalon 10mg", price: 25, unit: "per vial", category: "Wellness Peptides" },
    { code: "MS10", name: "MOTS-c 10mg", price: 30, unit: "per vial", category: "Wellness Peptides" },
    { code: "CU50", name: "GHK-Cu 50mg", price: 20, unit: "per vial", category: "Wellness Peptides" },
    { code: "AU100", name: "AHK-Cu 100mg", price: 40, unit: "per vial", category: "Wellness Peptides" },
    { code: "TSM10", name: "Tesamorelin 10mg", price: 50, unit: "per vial", category: "Wellness Peptides" },
    { code: "IP10", name: "Ipamorelin 10mg", price: 30, unit: "per vial", category: "Wellness Peptides" },
    { code: "SK10", name: "Selank 10mg", price: 23, unit: "per vial", category: "Wellness Peptides" },
    { code: "SX10", name: "Semax 10mg", price: 23, unit: "per vial", category: "Wellness Peptides" },
    { code: "P141", name: "PT-141 10mg", price: 25, unit: "per vial", category: "Wellness Peptides" },
  
    // -------- Supplies --------
    { code: "BW30", name: "Bacteriostatic Water – 30ml", price: 15, unit: "per vial", category: "Supplies" },
    { code: "BW10", name: "Bacteriostatic Water – 10ml", price: 8, unit: "per vial", category: "Supplies" },
    { code: "BW03", name: "Bacteriostatic Water – 3ml", price: 4, unit: "per vial", category: "Supplies" },
    { code: "SY10", name: "31g 5/16″ 1ml - Syringes (10-pack)", price: 5, unit: "per pack", category: "Supplies" },
    { code: "SY05", name: "31g 5/8″ 0.5ml - Syringes (10-pack)", price: 5, unit: "per pack", category: "Supplies" },
    { code: "SY03", name: "31g 5/8″ 0.3ml - Syringes (10-pack)", price: 5, unit: "per pack", category: "Supplies" },
    { code: "SY23", name: "23g 0.3ml - Syringe for reconstitution", price: 1, unit: "each", category: "Supplies" },
    { code: "AW19", name: "Alcohol Wipes (100-pack)", price: 5, unit: "per pack", category: "Supplies" },
  ];
  
  
  
  