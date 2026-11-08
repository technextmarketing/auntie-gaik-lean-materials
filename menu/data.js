/* Auntie Gaik Lean's - menu data (shared by menu/index.html and menu/print.html).
   NO prices. Descriptions are generic: what the classic dish is, never a house claim.
   Photos only for dishes with a real photo of that dish; every other dish is a typographic card. */
window.AG_MENU = {
  note: "Dishes change with the market; ask the team for today's menu and prices.",
  book: "https://inline.app/booking/-OnKy8jPaRn_LUmJ5tDV:inline-live-4/-OnKy8r2gI9_CX8R2D7X",
  phone: "+60 17-434 4398",
  tel: "tel:+60174344398",
  wa: "60174344398",
  address: "1 Lebuh Bishop (Bishop Street), George Town, 10200 Penang",
  hours: "Wed-Sun · lunch 12pm-2.30pm · dinner 6pm-9.30pm · closed Mon and Tue",
  chapters: [
    {
      id: "small", n: 1, title: "Small plates & kuih", short: "Small plates",
      line: "Little things to share while the curries come: crisp, sour, a little sweet.",
      dishes: [
        { id: "baba-delight", name: "Baba Delight platter", local: "Four small plates on one",
          desc: "A platter of four: Kuih Pie Tee, Lor Bak, Cucur Udang and Acar Awak." },
        { id: "kuih-pie-tee", name: "Kuih Pie Tee", local: "Top hats", pick: true,
          desc: "Crisp pastry cups filled with braised jicama, one bite each.",
          photo: { src: "img/pie-tee.webp", lg: "img/pie-tee.webp", pos: "50% 55%", alt: "Yellow Kuih Pie Tee cups on a dark plate", w: 480, h: 360 } },
        { id: "jiu-hu-char", name: "Jiu Hu Char", local: "Jicama with cuttlefish",
          desc: "Shredded jicama stir-fried with dried cuttlefish, eaten wrapped in lettuce." },
        { id: "otak-otak", name: "Otak-Otak", local: "Steamed fish custard", pick: true,
          desc: "Fish blended with spices and coconut milk, steamed in banana leaf." },
        { id: "egg-belanda", name: "Egg Belanda", local: "An old Nyonya egg dish",
          desc: "A traditional Nyonya egg dish. Ask the team how it is served today." }
      ]
    },
    {
      id: "curries", n: 2, title: "Curries & mains", short: "Curries",
      line: "The heart of the table. Every rempah made by hand, from scratch, on site.",
      dishes: [
        { id: "curry-kapitan", name: "Curry Kapitan", local: "Kari Kapitan", zh: "甲必丹咖哩鸡",
          desc: "Chicken in a rich curry of candlenut, lemongrass and coconut milk.",
          photo: { src: "../assets/img/dish-curry-kapitan-md.webp", lg: "../assets/img/dish-curry-kapitan-lg.webp", pos: "50% 55%", alt: "Curry Kapitan in a blue-and-white bowl", w: 900, h: 637 } },
        { id: "nyonya-curry-chicken", name: "Nyonya Curry Chicken", local: "Kari Ayam",
          desc: "Chicken and potatoes in a spiced coconut curry, made for rice." },
        { id: "beef-rendang", name: "Nyonya Beef Rendang", local: "Rendang Daging",
          desc: "Beef cooked slowly in coconut and spices until the gravy clings." },
        { id: "gulai-tumis", name: "Gulai Tumis", local: "Wild Grouper Curry Tumis", pick: true,
          desc: "A sour, spicy tamarind curry with wild grouper, its rempah built from eight or more ingredients." },
        { id: "assam-prawns", name: "Assam Prawns", local: "Assam Hae",
          desc: "Prawns glazed in tamarind: sour first, then sweet.",
          photo: { src: "../assets/img/food-1624-md.webp", lg: "../assets/img/food-1624-lg.webp", pos: "60% 62%", alt: "Tamarind-glazed prawns on a blue-rimmed plate with salad", w: 600, h: 900 } },
        { id: "sambal-udang", name: "Sambal Udang", local: "Prawns in sambal",
          desc: "Prawns cooked down in a red chilli sambal." },
        { id: "sambal-petai-sotong", name: "Sambal Petai Sotong", local: "Squid and petai in sambal",
          desc: "Squid with petai beans in chilli sambal; petai has a bold taste of its own." },
        { id: "ikan-goreng-kunyit", name: "Ikan Goreng Kunyit", local: "with Nanchut sauce",
          desc: "Fish fried with turmeric, served with Nanchut sauce on the side.",
          photo: { src: "../assets/img/dish-ikan-goreng-kunyit-md.webp", lg: "../assets/img/dish-ikan-goreng-kunyit-lg.webp", pos: "45% 30%", alt: "Turmeric fried fish on a blue plate", w: 676, h: 900 } },
        { id: "chye-por-omelette", name: "Chye Por Omelette", local: "Preserved radish omelette", zh: "菜脯蛋",
          desc: "A thick omelette folded with preserved radish, salty and soft.",
          photo: { src: "../assets/img/dish-chye-por-omelette-md.webp", lg: "../assets/img/dish-chye-por-omelette-lg.webp", pos: "50% 40%", alt: "Chye Por Omelette on a blue-and-white plate", w: 900, h: 621 } }
      ]
    },
    {
      id: "soup-veg", n: 3, title: "Soup & vegetables", short: "Soup & veg",
      line: "Sour, fresh and green, to balance the curries.",
      dishes: [
        { id: "kiam-chai-ark", name: "Kiam Chai Ark", local: "Salted-vegetable duck soup", zh: "咸菜鸭",
          desc: "Duck simmered with salted mustard greens in a sour broth." },
        { id: "terung-sambal", name: "Terung Sambal", local: "Sambal brinjal",
          desc: "Brinjal cooked soft and topped with sambal." },
        { id: "kerabu-pucuk-paku", name: "Kerabu Pucuk Paku", local: "Fern shoot salad",
          desc: "Young fern shoots tossed with lime, chilli and coconut.",
          photo: { src: "../assets/img/dish-kerabu-pucuk-paku-md.webp", lg: "../assets/img/dish-kerabu-pucuk-paku-lg.webp", pos: "50% 50%", alt: "Kerabu Pucuk Paku in a blue floral bowl", w: 900, h: 678 } },
        { id: "sambal-kangkung", name: "Sambal Kangkung", local: "Water spinach in sambal",
          desc: "Water spinach stir-fried quickly with sambal." }
      ]
    },
    {
      id: "rice", n: 4, title: "Rice", short: "Rice",
      line: "Rice dishes to anchor the table, from herb-tossed Nasi Ulam to Nyonya fried rice.",
      dishes: [
        { id: "nasi-ulam", name: "Nasi Ulam", local: "Herb rice", pick: true,
          desc: "Rice tossed with finely cut herbs and leaves, fresh and fragrant." },
        { id: "kerabu-bee-hoon", name: "Kerabu Bee Hoon", local: "Vermicelli salad",
          desc: "Rice vermicelli tossed with lime, sambal and herbs." },
        { id: "nyonya-fried-rice", name: "Nyonya Fried Rice", local: "Nasi Goreng",
          desc: "Rice fried the Nyonya way." }
      ]
    },
    {
      id: "desserts", n: 5, title: "Desserts", short: "Desserts",
      line: "Coconut milk, palm sugar and black glutinous rice: the old school way to finish.",
      dishes: [
        { id: "bee-koh-moy", name: "Bee Koh Moy", local: "Pulut Hitam", zh: "黑糯米", pick: true,
          desc: "Black glutinous rice cooked soft, finished with coconut milk." },
        { id: "sago-gula-melaka", name: "Sago Gula Melaka", local: "Sago with palm sugar",
          desc: "Chilled sago pearls with palm sugar syrup and coconut milk." },
        { id: "pengat", name: "Pengat", local: "Pisang Raja in coconut milk",
          desc: "Pisang Raja bananas, sweet potato and yam in coconut milk.",
          photo: { src: "../assets/img/dining-6692-md.webp", lg: "../assets/img/dining-6692-lg.webp", pos: "30% 62%", alt: "Pengat in a blue-and-white bowl beside a bunch of bananas", w: 600, h: 900 } }
      ]
    },
    {
      id: "drinks", n: 6, title: "Drinks", short: "Drinks", drinks: true,
      line: "Three cool ones to calm the sambal.",
      dishes: [
        { id: "rose-selasih", name: "Rose Selasih", local: "Rose and basil seed",
          desc: "Rose syrup over ice with basil seeds.",
          photo: { src: "../assets/img/drink-rose-selasih-md.webp", lg: "../assets/img/drink-rose-selasih-lg.webp", pos: "50% 55%", alt: "A tall glass of Rose Selasih", w: 583, h: 900 } },
        { id: "nutmeg-juice", name: "Nutmeg Juice", local: "Air buah pala",
          desc: "A cooling drink made from nutmeg, a Penang classic.",
          photo: { src: "../assets/img/drink-nutmeg-juice-md.webp", lg: "../assets/img/drink-nutmeg-juice-lg.webp", pos: "45% 60%", alt: "A glass of Nutmeg Juice", w: 543, h: 900 } },
        { id: "bandung", name: "Bandung", local: "Rose milk",
          desc: "Rose syrup and milk over ice, pink and sweet.",
          photo: { src: "../assets/img/drink-bandung-md.webp", lg: "../assets/img/drink-bandung-lg.webp", pos: "40% 50%", alt: "A tall glass of pink Bandung", w: 606, h: 900 } }
      ]
    }
  ]
};
