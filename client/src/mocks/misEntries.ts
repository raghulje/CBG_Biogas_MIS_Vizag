
export interface MISEntry {
  id: string;
  date: string;
  status: 'Draft' | 'Submitted' | 'Approved';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  rawMaterials: {
    cowDungPurchased: number;
    cowDungStock: number;
    oldPressMudOpeningBalance: number;
    oldPressMudPurchased: number;
    oldPressMudDegradationLoss: number;
    oldPressMudClosingStock: number;
    newPressMudPurchased: number;
    pressMudUsed: number;
    totalPressMudStock: number;
    auditNote: string;
  };
  feedMixingTank: {
    cowDungFeed: { qty: number; ts: number; vs: number };
    pressmudFeed: { qty: number; ts: number; vs: number };
    permeateFeed: { qty: number; ts: number; vs: number };
    waterQty: number;
    waterTs?: number;
    waterVs?: number;
    pulpFeed?: { qty: number; ts: number; vs: number };
    maggieFeed?: { qty: number; ts: number; vs: number };
    otherFeedSubstrate?: { qty: number; ts: number; vs: number };
    slurry: { total: number; ts: number; vs: number; ph: number };
  };
  digesters: Array<{
    id: number;
    name: string;
    feeding: { totalSlurryFeed: number; avgTs: number; avgVs: number };
    discharge: { totalSlurryOut: number; avgTs: number; avgVs: number };
    characteristics: {
      lignin: number;
      vfa: number;
      alkalinity: number;
      vfaAlkRatio: number;
      ash: number;
      density: number;
      ph: number;
      temperature: number;
      pressure: number;
      slurryLevel: number;
    };
    health: {
      hrt: number;
      vsDestruction: number;
      olr: number;
      balloonLevel: number;
      agitatorCondition: string;
      foamingLevel: number;
    };
  }>;
  slsMachine: {
    waterConsumption: number;
    polyElectrolyte: number;
    solution: number;
    slurryFeed: number;
    wetCakeProduction: number;
    wetCakeTs: number;
    wetCakeVs: number;
    liquidProduced: number;
    liquidTs: number;
    liquidVs: number;
    liquidSentToLagoon: number;
  };
  rawBiogas: {
    digester01Gas: number;
    digester02Gas: number;
    digester03Gas: number;
    totalRawBiogas: number;
    rbgFlared: number;
    gasYield: number;
  };
  rawBiogasQuality: {
    ch4: number;
    co2: number;
    h2s: number;
    o2: number;
    n2: number;
  };
  compressedBiogas: {
    produced: number;
    ch4: number;
    co2: number;
    h2s: number;
    o2: number;
    n2: number;
    conversionRatio: number;
    ch4Slippage: number;
    cbgStock: number;
    cbgSold: number;
  };
  compressors: {
    compressor1Hours: number;
    compressor2Hours: number;
    totalHours: number;
  };
  fertilizer: {
    fomProduced: number;
    inventory: number;
    sold: number;
    weightedAverage: number;
    revenue1: number;
    lagoonLiquidSold: number;
    revenue2: number;
    looseFomSold: number;
    revenue3: number;
  };
  utilities: {
    electricityConsumption: number;
    specificPowerConsumption: number;
  };
  manpower: {
    refexSrelStaff: number;
    thirdPartyStaff: number;
  };
  plantAvailability: {
    workingHours: number;
    scheduledDowntime: number;
    unscheduledDowntime: number;
    totalAvailability: number;
  };
  hse: {
    safetyLti: number;
    nearMisses: number;
    firstAid: number;
    reportableIncidents: number;
    mti: number;
    otherIncidents: number;
    fatalities: number;
  };
  remarks: string;
}

export const mockMISEntries: MISEntry[] = [
  {
    id: 'MIS-2024-001',
    date: '2024-01-15',
    status: 'Submitted',
    createdBy: 'John Doe',
    createdAt: '2024-01-15T08:30:00Z',
    updatedAt: '2024-01-15T16:45:00Z',
    rawMaterials: {
      cowDungPurchased: 5000,
      cowDungStock: 2000,
      oldPressMudOpeningBalance: 1500,
      oldPressMudPurchased: 800,
      oldPressMudDegradationLoss: 50,
      oldPressMudClosingStock: 1200,
      newPressMudPurchased: 600,
      pressMudUsed: 1500,
      totalPressMudStock: 2100,
      auditNote: 'All materials verified and accounted for.',
    },
    feedMixingTank: {
      cowDungFeed: { qty: 3500, ts: 18.5, vs: 82.3 },
      pressmudFeed: { qty: 1200, ts: 22.1, vs: 78.5 },
      permeateFeed: { qty: 800, ts: 3.2, vs: 65.0 },
      waterQty: 2500,
      slurry: { total: 8000, ts: 12.5, vs: 76.8, ph: 7.2 },
    },
    digesters: [
      {
        id: 1,
        name: 'Digester 01',
        feeding: { totalSlurryFeed: 2800, avgTs: 12.5, avgVs: 76.8 },
        discharge: { totalSlurryOut: 2600, avgTs: 6.2, avgVs: 58.5 },
        characteristics: {
          lignin: 15.2,
          vfa: 1850,
          alkalinity: 8500,
          vfaAlkRatio: 0.22,
          ash: 28.5,
          density: 1.02,
          ph: 7.1,
          temperature: 38.5,
          pressure: 12.5,
          slurryLevel: 85,
        },
        health: {
          hrt: 25,
          vsDestruction: 65.2,
          olr: 3.2,
          balloonLevel: 78,
          agitatorCondition: 'OK',
          foamingLevel: 15,
        },
      },
      {
        id: 2,
        name: 'Digester 02',
        feeding: { totalSlurryFeed: 2700, avgTs: 12.3, avgVs: 76.5 },
        discharge: { totalSlurryOut: 2500, avgTs: 6.0, avgVs: 57.8 },
        characteristics: {
          lignin: 14.8,
          vfa: 1780,
          alkalinity: 8200,
          vfaAlkRatio: 0.21,
          ash: 27.8,
          density: 1.01,
          ph: 7.0,
          temperature: 38.2,
          pressure: 12.2,
          slurryLevel: 82,
        },
        health: {
          hrt: 26,
          vsDestruction: 64.8,
          olr: 3.1,
          balloonLevel: 75,
          agitatorCondition: 'OK',
          foamingLevel: 12,
        },
      },
      {
        id: 3,
        name: 'Digester 03',
        feeding: { totalSlurryFeed: 2500, avgTs: 12.4, avgVs: 76.6 },
        discharge: { totalSlurryOut: 2300, avgTs: 6.1, avgVs: 58.0 },
        characteristics: {
          lignin: 15.0,
          vfa: 1820,
          alkalinity: 8350,
          vfaAlkRatio: 0.22,
          ash: 28.2,
          density: 1.02,
          ph: 7.1,
          temperature: 38.4,
          pressure: 12.4,
          slurryLevel: 83,
        },
        health: {
          hrt: 25,
          vsDestruction: 65.0,
          olr: 3.15,
          balloonLevel: 76,
          agitatorCondition: 'OK',
          foamingLevel: 14,
        },
      },
    ],
    slsMachine: {
      waterConsumption: 1200,
      polyElectrolyte: 25,
      solution: 500,
      slurryFeed: 7400,
      wetCakeProduction: 1850,
      wetCakeTs: 28.5,
      wetCakeVs: 72.3,
      liquidProduced: 5550,
      liquidTs: 2.8,
      liquidVs: 55.2,
      liquidSentToLagoon: 4500,
    },
    rawBiogas: {
      digester01Gas: 4200,
      digester02Gas: 4050,
      digester03Gas: 3850,
      totalRawBiogas: 12100,
      rbgFlared: 150,
      gasYield: 1.51,
    },
    rawBiogasQuality: {
      ch4: 58.5,
      co2: 38.2,
      h2s: 1850,
      o2: 0.8,
      n2: 2.5,
    },
    compressedBiogas: {
      produced: 850,
      ch4: 96.5,
      co2: 2.8,
      h2s: 5,
      o2: 0.2,
      n2: 0.5,
      conversionRatio: 14.2,
      ch4Slippage: 1.2,
      cbgStock: 2500,
      cbgSold: 800,
    },
    compressors: {
      compressor1Hours: 18,
      compressor2Hours: 16,
      totalHours: 34,
    },
    fertilizer: {
      fomProduced: 1850,
      inventory: 5200,
      sold: 1500,
      weightedAverage: 4.5,
      revenue1: 6750,
      lagoonLiquidSold: 3000,
      revenue2: 1500,
      looseFomSold: 500,
      revenue3: 1250,
    },
    utilities: {
      electricityConsumption: 450,
      specificPowerConsumption: 0.53,
    },
    manpower: {
      refexSrelStaff: 12,
      thirdPartyStaff: 8,
    },
    plantAvailability: {
      workingHours: 22,
      scheduledDowntime: 1.5,
      unscheduledDowntime: 0.5,
      totalAvailability: 91.7,
    },
    hse: {
      safetyLti: 0,
      nearMisses: 1,
      firstAid: 0,
      reportableIncidents: 0,
      mti: 0,
      otherIncidents: 0,
      fatalities: 0,
    },
    remarks: 'Plant operating normally. Minor maintenance scheduled for next week.',
  },
  {
    id: 'MIS-2024-002',
    date: '2024-01-16',
    status: 'Approved',
    createdBy: 'Jane Smith',
    createdAt: '2024-01-16T09:00:00Z',
    updatedAt: '2024-01-16T17:30:00Z',
    rawMaterials: {
      cowDungPurchased: 4800,
      cowDungStock: 2200,
      oldPressMudOpeningBalance: 1200,
      oldPressMudPurchased: 900,
      oldPressMudDegradationLoss: 45,
      oldPressMudClosingStock: 1100,
      newPressMudPurchased: 550,
      pressMudUsed: 1450,
      totalPressMudStock: 2050,
      auditNote: 'Stock levels verified.',
    },
    feedMixingTank: {
      cowDungFeed: { qty: 3400, ts: 18.2, vs: 81.8 },
      pressmudFeed: { qty: 1150, ts: 21.8, vs: 78.0 },
      permeateFeed: { qty: 750, ts: 3.0, vs: 64.5 },
      waterQty: 2400,
      slurry: { total: 7700, ts: 12.2, vs: 76.2, ph: 7.1 },
    },
    digesters: [
      {
        id: 1,
        name: 'Digester 01',
        feeding: { totalSlurryFeed: 2700, avgTs: 12.2, avgVs: 76.2 },
        discharge: { totalSlurryOut: 2500, avgTs: 6.0, avgVs: 58.0 },
        characteristics: {
          lignin: 15.0,
          vfa: 1800,
          alkalinity: 8400,
          vfaAlkRatio: 0.21,
          ash: 28.0,
          density: 1.02,
          ph: 7.0,
          temperature: 38.3,
          pressure: 12.3,
          slurryLevel: 84,
        },
        health: {
          hrt: 26,
          vsDestruction: 64.8,
          olr: 3.1,
          balloonLevel: 77,
          agitatorCondition: 'OK',
          foamingLevel: 13,
        },
      },
      {
        id: 2,
        name: 'Digester 02',
        feeding: { totalSlurryFeed: 2600, avgTs: 12.1, avgVs: 76.0 },
        discharge: { totalSlurryOut: 2400, avgTs: 5.9, avgVs: 57.5 },
        characteristics: {
          lignin: 14.6,
          vfa: 1750,
          alkalinity: 8100,
          vfaAlkRatio: 0.22,
          ash: 27.5,
          density: 1.01,
          ph: 7.0,
          temperature: 38.1,
          pressure: 12.1,
          slurryLevel: 81,
        },
        health: {
          hrt: 27,
          vsDestruction: 64.5,
          olr: 3.0,
          balloonLevel: 74,
          agitatorCondition: 'OK',
          foamingLevel: 11,
        },
      },
      {
        id: 3,
        name: 'Digester 03',
        feeding: { totalSlurryFeed: 2400, avgTs: 12.2, avgVs: 76.1 },
        discharge: { totalSlurryOut: 2200, avgTs: 6.0, avgVs: 57.8 },
        characteristics: {
          lignin: 14.8,
          vfa: 1780,
          alkalinity: 8250,
          vfaAlkRatio: 0.22,
          ash: 27.8,
          density: 1.01,
          ph: 7.0,
          temperature: 38.2,
          pressure: 12.2,
          slurryLevel: 82,
        },
        health: {
          hrt: 26,
          vsDestruction: 64.6,
          olr: 3.05,
          balloonLevel: 75,
          agitatorCondition: 'OK',
          foamingLevel: 12,
        },
      },
    ],
    slsMachine: {
      waterConsumption: 1150,
      polyElectrolyte: 24,
      solution: 480,
      slurryFeed: 7100,
      wetCakeProduction: 1780,
      wetCakeTs: 28.2,
      wetCakeVs: 71.8,
      liquidProduced: 5320,
      liquidTs: 2.7,
      liquidVs: 54.8,
      liquidSentToLagoon: 4300,
    },
    rawBiogas: {
      digester01Gas: 4100,
      digester02Gas: 3950,
      digester03Gas: 3750,
      totalRawBiogas: 11800,
      rbgFlared: 120,
      gasYield: 1.53,
    },
    rawBiogasQuality: {
      ch4: 58.8,
      co2: 37.9,
      h2s: 1780,
      o2: 0.7,
      n2: 2.6,
    },
    compressedBiogas: {
      produced: 830,
      ch4: 96.8,
      co2: 2.5,
      h2s: 4,
      o2: 0.2,
      n2: 0.5,
      conversionRatio: 14.2,
      ch4Slippage: 1.1,
      cbgStock: 2530,
      cbgSold: 780,
    },
    compressors: {
      compressor1Hours: 17,
      compressor2Hours: 17,
      totalHours: 34,
    },
    fertilizer: {
      fomProduced: 1780,
      inventory: 5480,
      sold: 1400,
      weightedAverage: 4.6,
      revenue1: 6440,
      lagoonLiquidSold: 2800,
      revenue2: 1400,
      looseFomSold: 480,
      revenue3: 1200,
    },
    utilities: {
      electricityConsumption: 440,
      specificPowerConsumption: 0.53,
    },
    manpower: {
      refexSrelStaff: 12,
      thirdPartyStaff: 8,
    },
    plantAvailability: {
      workingHours: 23,
      scheduledDowntime: 1,
      unscheduledDowntime: 0,
      totalAvailability: 95.8,
    },
    hse: {
      safetyLti: 0,
      nearMisses: 0,
      firstAid: 0,
      reportableIncidents: 0,
      mti: 0,
      otherIncidents: 0,
      fatalities: 0,
    },
    remarks: 'Excellent production day. All systems running optimally.',
  },
  {
    id: 'MIS-2024-003',
    date: '2024-01-17',
    status: 'Draft',
    createdBy: 'Mike Johnson',
    createdAt: '2024-01-17T10:15:00Z',
    updatedAt: '2024-01-17T14:20:00Z',
    rawMaterials: {
      cowDungPurchased: 4500,
      cowDungStock: 2100,
      oldPressMudOpeningBalance: 1100,
      oldPressMudPurchased: 700,
      oldPressMudDegradationLoss: 40,
      oldPressMudClosingStock: 1000,
      newPressMudPurchased: 500,
      pressMudUsed: 1300,
      totalPressMudStock: 1900,
      auditNote: 'Pending verification.',
    },
    feedMixingTank: {
      cowDungFeed: { qty: 3200, ts: 18.0, vs: 81.5 },
      pressmudFeed: { qty: 1100, ts: 21.5, vs: 77.5 },
      permeateFeed: { qty: 700, ts: 2.9, vs: 64.0 },
      waterQty: 2300,
      slurry: { total: 7300, ts: 12.0, vs: 75.8, ph: 7.0 },
    },
    digesters: [
      {
        id: 1,
        name: 'Digester 01',
        feeding: { totalSlurryFeed: 2500, avgTs: 12.0, avgVs: 75.8 },
        discharge: { totalSlurryOut: 2300, avgTs: 5.8, avgVs: 57.5 },
        characteristics: {
          lignin: 14.8,
          vfa: 1750,
          alkalinity: 8300,
          vfaAlkRatio: 0.21,
          ash: 27.8,
          density: 1.01,
          ph: 7.0,
          temperature: 38.0,
          pressure: 12.0,
          slurryLevel: 82,
        },
        health: {
          hrt: 27,
          vsDestruction: 64.2,
          olr: 3.0,
          balloonLevel: 75,
          agitatorCondition: 'OK',
          foamingLevel: 12,
        },
      },
      {
        id: 2,
        name: 'Digester 02',
        feeding: { totalSlurryFeed: 2400, avgTs: 11.9, avgVs: 75.6 },
        discharge: { totalSlurryOut: 2200, avgTs: 5.7, avgVs: 57.2 },
        characteristics: {
          lignin: 14.5,
          vfa: 1720,
          alkalinity: 8000,
          vfaAlkRatio: 0.22,
          ash: 27.2,
          density: 1.01,
          ph: 6.9,
          temperature: 37.8,
          pressure: 11.9,
          slurryLevel: 80,
        },
        health: {
          hrt: 28,
          vsDestruction: 64.0,
          olr: 2.9,
          balloonLevel: 73,
          agitatorCondition: 'OK',
          foamingLevel: 10,
        },
      },
      {
        id: 3,
        name: 'Digester 03',
        feeding: { totalSlurryFeed: 2400, avgTs: 12.0, avgVs: 75.7 },
        discharge: { totalSlurryOut: 2200, avgTs: 5.8, avgVs: 57.3 },
        characteristics: {
          lignin: 14.6,
          vfa: 1740,
          alkalinity: 8150,
          vfaAlkRatio: 0.21,
          ash: 27.5,
          density: 1.01,
          ph: 7.0,
          temperature: 37.9,
          pressure: 12.0,
          slurryLevel: 81,
        },
        health: {
          hrt: 27,
          vsDestruction: 64.1,
          olr: 2.95,
          balloonLevel: 74,
          agitatorCondition: 'Not OK',
          foamingLevel: 11,
        },
      },
    ],
    slsMachine: {
      waterConsumption: 1100,
      polyElectrolyte: 23,
      solution: 460,
      slurryFeed: 6700,
      wetCakeProduction: 1680,
      wetCakeTs: 27.8,
      wetCakeVs: 71.2,
      liquidProduced: 5020,
      liquidTs: 2.6,
      liquidVs: 54.2,
      liquidSentToLagoon: 4100,
    },
    rawBiogas: {
      digester01Gas: 3900,
      digester02Gas: 3750,
      digester03Gas: 3600,
      totalRawBiogas: 11250,
      rbgFlared: 100,
      gasYield: 1.54,
    },
    rawBiogasQuality: {
      ch4: 58.2,
      co2: 38.5,
      h2s: 1900,
      o2: 0.8,
      n2: 2.5,
    },
    compressedBiogas: {
      produced: 790,
      ch4: 96.2,
      co2: 3.0,
      h2s: 6,
      o2: 0.3,
      n2: 0.5,
      conversionRatio: 14.2,
      ch4Slippage: 1.3,
      cbgStock: 2520,
      cbgSold: 750,
    },
    compressors: {
      compressor1Hours: 16,
      compressor2Hours: 16,
      totalHours: 32,
    },
    fertilizer: {
      fomProduced: 1680,
      inventory: 5560,
      sold: 1300,
      weightedAverage: 4.5,
      revenue1: 5850,
      lagoonLiquidSold: 2600,
      revenue2: 1300,
      looseFomSold: 450,
      revenue3: 1125,
    },
    utilities: {
      electricityConsumption: 420,
      specificPowerConsumption: 0.53,
    },
    manpower: {
      refexSrelStaff: 11,
      thirdPartyStaff: 8,
    },
    plantAvailability: {
      workingHours: 21,
      scheduledDowntime: 2,
      unscheduledDowntime: 1,
      totalAvailability: 87.5,
    },
    hse: {
      safetyLti: 0,
      nearMisses: 2,
      firstAid: 1,
      reportableIncidents: 0,
      mti: 0,
      otherIncidents: 0,
      fatalities: 0,
    },
    remarks: 'Digester 03 agitator requires maintenance. Scheduled for tomorrow.',
  },
];

export const getEmptyMISEntry = (): Omit<MISEntry, 'id' | 'createdAt' | 'updatedAt'> => ({
  date: new Date().toISOString().split('T')[0],
  status: 'Draft',
  createdBy: 'Demo User',
  rawMaterials: {
    cowDungPurchased: 0,
    cowDungStock: 0,
    oldPressMudOpeningBalance: 0,
    oldPressMudPurchased: 0,
    oldPressMudDegradationLoss: 0,
    oldPressMudClosingStock: 0,
    newPressMudPurchased: 0,
    pressMudUsed: 0,
    totalPressMudStock: 0,
    auditNote: '',
  },
  feedMixingTank: {
    cowDungFeed: { qty: 0, ts: 0, vs: 0 },
    pressmudFeed: { qty: 0, ts: 0, vs: 0 },
    permeateFeed: { qty: 0, ts: 0, vs: 0 },
    waterQty: 0,
    slurry: { total: 0, ts: 0, vs: 0, ph: 0 },
  },
  digesters: [
    {
      id: 1,
      name: 'Digester 01',
      feeding: { totalSlurryFeed: 0, avgTs: 0, avgVs: 0 },
      discharge: { totalSlurryOut: 0, avgTs: 0, avgVs: 0 },
      characteristics: {
        lignin: 0,
        vfa: 0,
        alkalinity: 0,
        vfaAlkRatio: 0,
        ash: 0,
        density: 0,
        ph: 0,
        temperature: 0,
        pressure: 0,
        slurryLevel: 0,
      },
      health: {
        hrt: 0,
        vsDestruction: 0,
        olr: 0,
        balloonLevel: 0,
        agitatorCondition: 'OK',
        foamingLevel: 0,
      },
    },
  ],
  slsMachine: {
    waterConsumption: 0,
    polyElectrolyte: 0,
    solution: 0,
    slurryFeed: 0,
    wetCakeProduction: 0,
    wetCakeTs: 0,
    wetCakeVs: 0,
    liquidProduced: 0,
    liquidTs: 0,
    liquidVs: 0,
    liquidSentToLagoon: 0,
  },
  rawBiogas: {
    digester01Gas: 0,
    digester02Gas: 0,
    digester03Gas: 0,
    totalRawBiogas: 0,
    rbgFlared: 0,
    gasYield: 0,
  },
  rawBiogasQuality: {
    ch4: 0,
    co2: 0,
    h2s: 0,
    o2: 0,
    n2: 0,
  },
  compressedBiogas: {
    produced: 0,
    ch4: 0,
    co2: 0,
    h2s: 0,
    o2: 0,
    n2: 0,
    conversionRatio: 0,
    ch4Slippage: 0,
    cbgStock: 0,
    cbgSold: 0,
  },
  compressors: {
    compressor1Hours: 0,
    compressor2Hours: 0,
    totalHours: 0,
  },
  fertilizer: {
    fomProduced: 0,
    inventory: 0,
    sold: 0,
    weightedAverage: 0,
    revenue1: 0,
    lagoonLiquidSold: 0,
    revenue2: 0,
    looseFomSold: 0,
    revenue3: 0,
  },
  utilities: {
    electricityConsumption: 0,
    specificPowerConsumption: 0,
  },
  manpower: {
    refexSrelStaff: 0,
    thirdPartyStaff: 0,
  },
  plantAvailability: {
    workingHours: 0,
    scheduledDowntime: 0,
    unscheduledDowntime: 0,
    totalAvailability: 0,
  },
  hse: {
    safetyLti: 0,
    nearMisses: 0,
    firstAid: 0,
    reportableIncidents: 0,
    mti: 0,
    otherIncidents: 0,
    fatalities: 0,
  },
  remarks: '',
});
