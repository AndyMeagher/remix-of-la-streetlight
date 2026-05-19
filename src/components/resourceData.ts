import type { Resource } from "./ResourceCard";

// Coordinates for geolocation distance calculations
export const resourceCoordinates: Record<string, { lat: number; lng: number }> = {
  // Shelters
  s1: { lat: 34.1017, lng: -118.3256 }, // My Friend's Place
  s2: { lat: 34.0980, lng: -118.3090 }, // Covenant House
  s3: { lat: 34.0975, lng: -118.2928 }, // LA Youth Network
  s4: { lat: 33.9925, lng: -118.4680 }, // Safe Place for Youth
  s5: { lat: 33.7701, lng: -118.1937 }, // Timothy House
  s6: { lat: 33.9890, lng: -118.2780 }, // HOPICS
  s7: { lat: 34.0522, lng: -118.2437 }, // B.A.R.E. Truth Inc.
  s8: { lat: 34.0445, lng: -118.2390 }, // Los Angeles Mission
  s9: { lat: 34.0735, lng: -118.2560 }, // LA Dream Center
  // Food
  f1: { lat: 33.9985, lng: -118.2100 }, // LA Regional Food Bank
  f2: { lat: 34.0420, lng: -118.2470 }, // Midnight Mission
  f3: { lat: 34.0522, lng: -118.2437 }, // Angel Harvest
  f4: { lat: 33.9890, lng: -118.2700 }, // Zion Temple
  f5: { lat: 33.7455, lng: -117.8678 }, // Orangewood
  f6: { lat: 34.6868, lng: -118.1542 }, // Penny Lane Lancaster
  f7: { lat: 34.6920, lng: -118.1380 }, // Children's Center AV
  f8: { lat: 34.1672, lng: -118.3918 }, // Village Family Services
  f9: { lat: 34.1030, lng: -117.9350 }, // Pacific Clinics
  f10: { lat: 34.0945, lng: -118.3290 }, // LA LGBT Center
  f11: { lat: 34.0030, lng: -118.3340 }, // VOA LA
  f12: { lat: 33.9760, lng: -118.1670 }, // Penny Lane Commerce
  f13: { lat: 33.7700, lng: -118.1890 }, // Good Seed CDC
  f14: { lat: 34.0615, lng: -118.2790 }, // We Grow LA
  f15: { lat: 34.1478, lng: -118.1445 }, // Hillsides Youth Moving On
  // Transitional
  t1: { lat: 34.0515, lng: -118.2551 }, // First Place for Youth
  t2: { lat: 34.0980, lng: -118.3090 }, // Covenant House RoP
  t3: { lat: 34.0617, lng: -118.2816 }, // LA DCFS
  t4: { lat: 34.0720, lng: -118.2270 }, // Children's Law Center
  t5: { lat: 34.0522, lng: -118.2437 }, // THP+
  t6: { lat: 34.1010, lng: -118.3195 }, // Hollywood Community Housing
  t7: { lat: 34.1100, lng: -118.1950 }, // Optimist Youth Homes
  t8: { lat: 33.7455, lng: -117.8678 }, // Rising Tide Orangewood
  // Medical
  m1: { lat: 34.0979, lng: -118.2932 }, // Children's Hospital LA
  m2: { lat: 34.0756, lng: -118.3720 }, // Saban Free Clinic
  m3: { lat: 33.9910, lng: -118.4720 }, // Venice Family Clinic
  m4: { lat: 33.8580, lng: -118.2960 }, // Harbor-UCLA
  m5: { lat: 34.1316, lng: -118.0365 }, // USC Arcadia
  m6: { lat: 34.0870, lng: -117.9890 }, // San Gabriel Valley Medical
  m7: { lat: 34.2195, lng: -118.4390 }, // Valley Presbyterian
  m8: { lat: 34.2375, lng: -118.5365 }, // Northridge Hospital
  m9: { lat: 34.7420, lng: -118.1490 }, // Antelope Valley Hospital
  m10: { lat: 33.8360, lng: -117.9115 }, // Anaheim Global Medical Center
  m11: { lat: 33.9610, lng: -118.3690 }, // Centinela Hospital
  m12: { lat: 33.8580, lng: -118.2960 }, // Harbor General (same campus as Harbor-UCLA)
  // Trafficking
  tr1: { lat: 34.0522, lng: -118.2437 }, // Saving Innocence
  tr2: { lat: 34.0625, lng: -118.3380 }, // CAST
  tr3: { lat: 34.0522, lng: -118.2437 }, // Gems Uncovered
  tr4: { lat: 34.0522, lng: -118.2437 }, // National Hotline
  tr5: { lat: 34.1870, lng: -118.3890 }, // Treasures
  tr6: { lat: 34.0522, lng: -118.2437 }, // Northeast of the Well
  tr7: { lat: 33.7455, lng: -117.8678 }, // Project CHOICE
  tr8: { lat: 33.8958, lng: -118.2201 }, // Restoration Diversion
  tr9: { lat: 34.1865, lng: -118.4489 }, // Children of the Night
  tr10: { lat: 34.1064, lng: -117.5931 }, // Magdalena's Daughters
};

export const shelterResources: Resource[] = [
  {
    id: "s1",
    name: "My Friend's Place",
    address: "5850 Hollywood Blvd",
    distance: "0.8 mi",
    isOpen: true,
    hours: "9AM–5PM",
    phone: "3232246156",
    website: "https://myfriendsplace.org",
    tags: ["Youth", "Drop-in"],
  },
  {
    id: "s2",
    name: "Covenant House California",
    address: "1325 N Western Ave",
    distance: "1.2 mi",
    isOpen: true,
    hours: "24 Hours",
    phone: "3234617131",
    website: "https://www.covenanthouse.org",
    tags: ["18-24", "Overnight"],
  },
  {
    id: "s3",
    name: "Los Angeles Youth Network",
    address: "1565 N Vermont Ave",
    distance: "2.1 mi",
    isOpen: false,
    hours: "8AM–6PM",
    phone: "3239570611",
    website: "https://layn.org",
    tags: ["Youth", "Emergency"],
  },
  {
    id: "s4",
    name: "Safe Place for Youth",
    address: "2469 Lincoln Blvd",
    distance: "5.4 mi",
    isOpen: true,
    hours: "10AM–4PM",
    phone: "3108603576",
    website: "https://safeplaceforyouth.org",
    tags: ["Youth", "Drop-in"],
  },
  {
    id: "s5",
    name: "Timothy House – LB Rescue Mission",
    address: "1335 Pacific Ave, Long Beach",
    distance: "22.0 mi",
    isOpen: true,
    hours: "24 Hours",
    phone: "5625918427",
    website: "https://www.lbrescuemission.org",
    tags: ["Youth", "Overnight"],
  },
  {
    id: "s6",
    name: "HOPICS",
    address: "5849 S Crocker St",
    distance: "5.0 mi",
    isOpen: true,
    hours: "8AM–5PM",
    phone: "3232357606",
    website: "https://hopics.org",
    tags: ["Adults", "Housing", "Drop-in"],
  },
  {
    id: "s7",
    name: "B.A.R.E. Truth Inc.",
    address: "Los Angeles",
    distance: "Varies",
    isOpen: true,
    hours: "Varies",
    website: "https://baretruthinc.org",
    tags: ["Housing", "Mentorship", "Wellness"],
  },
  {
    id: "s8",
    name: "Los Angeles Mission",
    address: "303 E 5th St, Los Angeles",
    distance: "1.5 mi",
    isOpen: true,
    hours: "24 Hours",
    phone: "2136291227",
    website: "https://losangelesmission.org",
    tags: ["Adults", "Overnight", "Meals"],
  },
  {
    id: "s9",
    name: "LA Dream Center",
    address: "2301 Bellevue Ave, Los Angeles",
    distance: "2.5 mi",
    isOpen: true,
    hours: "24 Hours",
    phone: "2132738000",
    website: "https://dreamcenter.org",
    tags: ["Adults", "Overnight", "Rehabilitation"],
  },
];

export const foodResources: Resource[] = [
  {
    id: "f1",
    name: "LA Regional Food Bank",
    address: "1734 E 41st St",
    distance: "3.2 mi",
    isOpen: true,
    hours: "8AM–4:30PM",
    phone: "3232347121",
    website: "https://www.lafoodbank.org",
  },
  {
    id: "f2",
    name: "Midnight Mission",
    address: "601 S San Pedro St",
    distance: "1.8 mi",
    isOpen: true,
    hours: "24 Hours",
    phone: "2136240042",
    website: "https://www.midnightmission.org",
  },
  {
    id: "f3",
    name: "Angel Harvest",
    address: "Multiple Locations",
    distance: "Varies",
    isOpen: true,
    hours: "Varies",
    phone: "2139959888",
    website: "https://www.angelharvest.org",
  },
  {
    id: "f4",
    name: "Zion Temple Community Church",
    address: "1315 E Vernon Ave",
    distance: "4.5 mi",
    isOpen: true,
    hours: "Fridays 8AM",
    phone: "3232343436",
    tags: ["Community", "Food"],
  },
  {
    id: "f5",
    name: "Orangewood Foundation Resource Center",
    address: "1575 E 17th St, Santa Ana",
    distance: "33.0 mi",
    isOpen: true,
    hours: "Mon–Thu 8:30AM–5PM",
    phone: "7146190200",
    website: "https://orangewoodfoundation.org",
    tags: ["Youth", "Drop-in", "18-24"],
  },
  {
    id: "f6",
    name: "Penny Lane Centers: Yellow Submarine",
    address: "43520 Division St, Lancaster",
    distance: "60.0 mi",
    isOpen: true,
    hours: "Tue–Fri 1–7PM, Sat 8AM–8PM",
    phone: "6612664783",
    website: "https://pennylane.org",
    tags: ["Youth", "Drop-in", "16-25"],
  },
  {
    id: "f7",
    name: "Children's Center of Antelope Valley",
    address: "45111 Fern Ave, Lancaster",
    distance: "60.0 mi",
    isOpen: true,
    hours: "Mon–Fri 3–7PM, Sat–Sun 9AM–3PM",
    phone: "6619491206",
    website: "https://ccav.org",
    tags: ["Youth", "Drop-in", "16-25"],
  },
  {
    id: "f8",
    name: "The Village Family Services Drop-In Center",
    address: "6801 Coldwater Canyon Ave, North Hollywood",
    distance: "8.0 mi",
    isOpen: true,
    hours: "Mon–Thu 1–6PM, Fri 1–5PM",
    phone: "8187558786",
    website: "https://thevillagefs.org",
    tags: ["Youth", "Drop-in", "14-25"],
  },
  {
    id: "f9",
    name: "Pacific Clinics: Hope Youth Center",
    address: "13001 Ramona Blvd, Suite I, Irwindale",
    distance: "18.0 mi",
    isOpen: true,
    hours: "Sat–Sun 9AM–5PM, Mon–Fri 7:30AM–3:30PM",
    phone: "6263373828",
    website: "https://pacificclinics.org",
    tags: ["Youth", "Drop-in", "16-25"],
  },
  {
    id: "f10",
    name: "LA LGBT Center: Anita May Rosenstein Campus",
    address: "1118 N McCadden Pl, Los Angeles",
    distance: "1.5 mi",
    isOpen: true,
    hours: "Mon–Fri 7:30AM–3:30PM, Sat–Sun 7:30AM–1:30PM",
    phone: "3238602280",
    website: "https://lalgbtcenter.org",
    tags: ["Youth", "LGBTQ+", "Drop-in", "16-25"],
  },
  {
    id: "f11",
    name: "Volunteers of America Los Angeles",
    address: "5344 Crenshaw Blvd, Los Angeles",
    distance: "5.5 mi",
    isOpen: true,
    hours: "Mon–Fri 8AM–9PM, Sat–Sun 9AM–9PM",
    phone: "2132826618",
    website: "https://voala.org",
    tags: ["Youth", "Drop-in", "16-25"],
  },
  {
    id: "f12",
    name: "Penny Lane: With a Little Help from My Friends",
    address: "5628 E Slauson Ave, Commerce",
    distance: "8.0 mi",
    isOpen: true,
    hours: "Tue–Fri 1–7PM, Sat 8AM–8PM",
    phone: "3233189960",
    website: "https://pennylane.org",
    tags: ["Youth", "Drop-in", "16-25"],
  },
  {
    id: "f13",
    name: "Good Seed CDC",
    address: "1230 Pine Ave, Long Beach",
    distance: "22.0 mi",
    isOpen: true,
    hours: "Mon–Fri 8:30AM–6:30PM, Sat–Sun 9:30AM–6:30PM",
    phone: "",
    tags: ["Youth", "Drop-in", "16-25"],
  },
  {
    id: "f14",
    name: "We Grow LA",
    address: "3350 Wilshire Ave #721, Los Angeles",
    distance: "3.0 mi",
    isOpen: true,
    hours: "Varies",
    phone: "5622215968",
    website: "https://wegrowla.com",
    tags: ["Community", "Food", "Grocery Giveaway"],
  },
  {
    id: "f15",
    name: "Hillsides – Youth Moving On",
    address: "650 N Oakland Ave, Pasadena",
    distance: "12.0 mi",
    isOpen: true,
    hours: "24 Hours",
    phone: "6262191240",
    website: "https://www.youthmovingon.org",
    tags: ["Youth", "Drop-in", "16-25"],
  },
];

export const transitionalResources: Resource[] = [
  {
    id: "t1",
    name: "First Place for Youth",
    address: "300 S Grand Ave, Suite 3600",
    distance: "1.5 mi",
    isOpen: true,
    hours: "9AM–5PM",
    phone: "5102724110",
    website: "https://firstplaceforyouth.org",
    tags: ["AB12", "TAY", "18-24"],
  },
  {
    id: "t2",
    name: "Covenant House – Rights of Passage",
    address: "1325 N Western Ave",
    distance: "1.2 mi",
    isOpen: true,
    hours: "24 Hours",
    phone: "3234617131",
    website: "https://www.covenanthouse.org",
    tags: ["AB12", "THP-Plus", "18-24"],
  },
  {
    id: "t3",
    name: "LA DCFS – AB12 Extended Foster Care",
    address: "3075 Wilshire Blvd",
    distance: "2.8 mi",
    isOpen: true,
    hours: "8AM–5PM",
    phone: "8005404000",
    website: "https://dcfs.lacounty.gov",
    tags: ["AB12", "ILP", "Case Management"],
  },
  {
    id: "t4",
    name: "Children's Law Center – AB12 Advocacy",
    address: "201 Centre Plaza Dr",
    distance: "4.0 mi",
    isOpen: true,
    hours: "9AM–5PM",
    phone: "3239804516",
    website: "https://clcla.org",
    tags: ["AB12", "Legal Aid", "TAY"],
  },
  {
    id: "t5",
    name: "Transitional Housing Placement Plus (THP+)",
    address: "Multiple Locations",
    distance: "Varies",
    isOpen: true,
    hours: "24 Hours",
    phone: "2133517300",
    tags: ["THP-Plus", "TAY", "18-24"],
  },
  {
    id: "t6",
    name: "Hollywood Community Housing – TAY Program",
    address: "5020 Hollywood Blvd",
    distance: "0.9 mi",
    isOpen: false,
    hours: "9AM–5PM",
    phone: "3234622185",
    website: "https://hollywoodhousing.org",
    tags: ["TAY", "Transitional", "18-25"],
  },
  {
    id: "t7",
    name: "Optimist Youth Homes & Family Services (TLS)",
    address: "6957 N Figueroa St",
    distance: "7.2 mi",
    isOpen: true,
    hours: "24 Hours",
    phone: "8777496884",
    website: "https://oyhfs.org",
    tags: ["AB12", "TLS", "Foster Youth"],
  },
  {
    id: "t8",
    name: "Rising Tide – Orangewood Foundation",
    address: "1575 E 17th St, Santa Ana",
    distance: "33.0 mi",
    isOpen: true,
    hours: "Mon–Thu 8:30AM–5PM",
    phone: "7146190200",
    website: "https://orangewoodfoundation.org",
    tags: ["TAY", "Transitional", "18-25", "Housing"],
  },
];

export const traffickingResources: Resource[] = [
  {
    id: "tr1",
    name: "Saving Innocence",
    address: "P.O. Box 462400, Los Angeles",
    distance: "2.0 mi",
    isOpen: true,
    hours: "24 Hours",
    phone: "3232037500",
    website: "https://savinginnocence.org",
    tags: ["Youth", "CSEC", "24/7 Crisis"],
  },
  {
    id: "tr2",
    name: "CAST – Coalition to Abolish Slavery & Trafficking",
    address: "5042 Wilshire Blvd #586",
    distance: "3.1 mi",
    isOpen: true,
    hours: "9AM–5PM",
    phone: "2133651906",
    website: "https://www.castla.org",
    tags: ["Legal Aid", "Shelter", "Case Mgmt"],
  },
  {
    id: "tr3",
    name: "Gems Uncovered",
    address: "Los Angeles Area",
    distance: "Varies",
    isOpen: true,
    hours: "24 Hours",
    phone: "8662884673",
    website: "https://gemsuncovered.org",
    tags: ["Youth", "Mentorship", "Crisis"],
  },
  {
    id: "tr4",
    name: "National Human Trafficking Hotline",
    address: "Call or Text",
    distance: "—",
    isOpen: true,
    hours: "24 Hours",
    phone: "8883737888",
    website: "https://humantraffickinghotline.org",
    tags: ["Hotline", "Confidential", "24/7"],
  },
  {
    id: "tr5",
    name: "Treasures",
    address: "P.O. Box 9400, N. Hollywood",
    distance: "6.5 mi",
    isOpen: true,
    hours: "10AM–6PM",
    phone: "8189943500",
    website: "https://iamatreasure.com",
    tags: ["Women", "Outreach", "Support"],
  },
  {
    id: "tr6",
    name: "Northeast of the Well",
    address: "Los Angeles Area",
    distance: "Varies",
    isOpen: true,
    hours: "Varies",
    phone: "8187497191",
    website: "https://northeastofthewell.org",
    tags: ["Women", "Youth", "Restoration"],
  },
  {
    id: "tr7",
    name: "Project C.H.O.I.C.E. – Orangewood Foundation",
    address: "1575 E 17th St, Santa Ana",
    distance: "33.0 mi",
    isOpen: true,
    hours: "24/7 Warm Line",
    phone: "7146198413",
    website: "https://orangewoodfoundation.org",
    tags: ["Youth", "CSEC", "Drop-in", "11-21"],
  },
  {
    id: "tr8",
    name: "Restoration Diversion Services",
    address: "208 N Long Beach Blvd, Compton",
    distance: "12.0 mi",
    isOpen: true,
    hours: "Drop-in Hours",
    phone: "3106174079",
    tags: ["Women", "Shelter", "Drop-in", "Legal Aid"],
  },
  {
    id: "tr9",
    name: "Children of the Night",
    address: "14530 Sylvan St, Van Nuys",
    distance: "12.0 mi",
    isOpen: true,
    hours: "24 Hours",
    phone: "8005511300",
    website: "https://childrenofthenight.org",
    tags: ["Youth", "CSEC", "Shelter", "24/7 Hotline"],
  },
];

export const medicalResources: Resource[] = [
  {
    id: "m1",
    name: "Children's Hospital LA",
    address: "4650 Sunset Blvd",
    distance: "2.0 mi",
    isOpen: true,
    hours: "24 Hours",
    phone: "3236602450",
    website: "https://www.chla.org",
  },
  {
    id: "m2",
    name: "Saban Free Clinic",
    address: "8405 Beverly Blvd",
    distance: "3.5 mi",
    isOpen: true,
    hours: "9AM–5PM",
    phone: "3236536952",
    website: "https://www.sabancommunityclinic.org",
  },
  {
    id: "m3",
    name: "Venice Family Clinic",
    address: "604 Rose Ave",
    distance: "6.1 mi",
    isOpen: false,
    hours: "8AM–5PM",
    phone: "3103926195",
    website: "https://venicefamilyclinic.org",
  },
  {
    id: "m4",
    name: "Harbor-UCLA Medical Center",
    address: "1000 W Carson St, Torrance",
    distance: "15.0 mi",
    isOpen: true,
    hours: "24 Hours",
    phone: "3102222345",
    website: "https://dhs.lacounty.gov/harbor-ucla/",
    tags: ["ER", "Hospital"],
  },
  {
    id: "m5",
    name: "USC Arcadia Hospital",
    address: "300 W Huntington Dr, Arcadia",
    distance: "14.0 mi",
    isOpen: true,
    hours: "24 Hours",
    phone: "6264455011",
    website: "https://www.uscarcadia.org",
    tags: ["ER", "Hospital"],
  },
  {
    id: "m6",
    name: "San Gabriel Valley Medical Center",
    address: "438 W Las Tunas Dr, San Gabriel",
    distance: "11.0 mi",
    isOpen: true,
    hours: "24 Hours",
    phone: "6262898000",
    website: "https://www.sgvmc.org",
    tags: ["ER", "Hospital"],
  },
  {
    id: "m7",
    name: "Valley Presbyterian Hospital",
    address: "15107 Vanowen St, Van Nuys",
    distance: "12.0 mi",
    isOpen: true,
    hours: "24 Hours",
    phone: "8187823000",
    website: "https://www.valleypres.org",
    tags: ["ER", "Hospital"],
  },
  {
    id: "m8",
    name: "Northridge Hospital Medical Center",
    address: "18300 Roscoe Blvd, Northridge",
    distance: "18.0 mi",
    isOpen: true,
    hours: "24 Hours",
    phone: "8188857211",
    website: "https://www.northridgehospital.org",
    tags: ["ER", "Hospital"],
  },
  {
    id: "m9",
    name: "Antelope Valley Hospital",
    address: "1600 W Ave J, Lancaster",
    distance: "60.0 mi",
    isOpen: true,
    hours: "24 Hours",
    phone: "6619491000",
    website: "https://www.avhospital.org",
    tags: ["ER", "Hospital"],
  },
  {
    id: "m10",
    name: "Anaheim Global Medical Center",
    address: "1025 S Anaheim Blvd, Anaheim",
    distance: "28.0 mi",
    isOpen: true,
    hours: "24 Hours",
    phone: "7145335000",
    website: "https://www.anaheimgmc.com",
    tags: ["ER", "Hospital"],
  },
  {
    id: "m11",
    name: "Centinela Hospital Medical Center",
    address: "555 E Hardy St, Inglewood",
    distance: "10.0 mi",
    isOpen: true,
    hours: "24 Hours",
    phone: "3106731261",
    website: "https://www.centinelamed.com",
    tags: ["ER", "Hospital"],
  },
  {
    id: "m12",
    name: "Harbor General Hospital",
    address: "1000 W Carson St, Torrance",
    distance: "15.0 mi",
    isOpen: true,
    hours: "24 Hours",
    phone: "3102222345",
    website: "https://dhs.lacounty.gov/harbor-ucla/",
    tags: ["ER", "Hospital"],
  },
];
