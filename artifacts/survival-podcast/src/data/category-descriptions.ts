/**
 * Short topic summaries shown on the category-filtered archive view.
 * Keys are lowercase to match case-insensitive category lookups.
 * Voice: practical, specific, never corporate — TSP style.
 */
const descriptions: Record<string, string> = {
  permaculture:
    "Jack's deepest rabbit hole. These episodes cover everything from food forests and soil biology to whole-farm design — practical techniques you can start applying on any size property.",
  "gardening and horticulture":
    "From seed starting and soil amendments to season extension and pest management — real talk on growing more of your own food, whatever your space.",
  gardening:
    "From seed starting and soil amendments to season extension and pest management — real talk on growing more of your own food, whatever your space.",
  "small business and entrepreneurship":
    "How to build income streams you actually own. Jack covers everything from starting lean to scaling a side hustle into something that replaces a job.",
  "small business":
    "How to build income streams you actually own. Jack covers everything from starting lean to scaling a side hustle into something that replaces a job.",
  entrepreneurship:
    "How to build income streams you actually own. Jack covers everything from starting lean to scaling a side hustle into something that replaces a job.",
  "self defense and firearms":
    "Straight talk on tools, training, and mindset — from concealed carry fundamentals to home defense, without the politics or the posturing.",
  firearms:
    "Straight talk on tools, training, and mindset — from concealed carry fundamentals to home defense, without the politics or the posturing.",
  "self defense":
    "Straight talk on tools, training, and mindset — from concealed carry fundamentals to home defense, without the politics or the posturing.",
  investing:
    "Alternative investing strategies that don't depend on Wall Street doing you any favors — precious metals, real estate, tax-advantaged accounts, and building financial resilience.",
  "personal finance":
    "Debt reduction, emergency funds, and thinking about money as a tool for freedom rather than a scoreboard — no guru nonsense.",
  homesteading:
    "Chickens, pigs, rabbits, food preservation, well water, off-grid power — the full arc of producing more of what your family needs at home.",
  "natural health":
    "Taking ownership of your health instead of outsourcing it. These episodes cover nutrition, herbalism, functional medicine, and cutting through the noise on wellness claims.",
  health:
    "Taking ownership of your health instead of outsourcing it. These episodes cover nutrition, herbalism, functional medicine, and cutting through the noise on wellness claims.",
  "aquaponics and aquaculture":
    "Growing fish and vegetables together in closed-loop systems — from backyard setups to commercial-scale production, with guests who actually run the systems.",
  aquaponics:
    "Growing fish and vegetables together in closed-loop systems — from backyard setups to commercial-scale production, with guests who actually run the systems.",
  hunting:
    "Deer, hogs, elk, and beyond — episodes on ethical hunting, processing your own meat, and integrating wild food into a self-reliant lifestyle.",
  fishing:
    "From backyard ponds to backcountry streams, these episodes treat fishing as a real food-production skill, not just a hobby.",
  "food storage and preservation":
    "Canning, dehydrating, fermenting, freeze-drying, and building a working pantry that actually gets rotated and used.",
  "food storage":
    "Canning, dehydrating, fermenting, freeze-drying, and building a working pantry that actually gets rotated and used.",
  "food preservation":
    "Canning, dehydrating, fermenting, freeze-drying, and building a working pantry that actually gets rotated and used.",
  "bushcraft and wilderness survival":
    "Fire, shelter, navigation, and foraging — foundational skills for operating confidently in the backcountry, regardless of your gear loadout.",
  bushcraft:
    "Fire, shelter, navigation, and foraging — foundational skills for operating confidently in the backcountry, regardless of your gear loadout.",
  "wilderness survival":
    "Fire, shelter, navigation, and foraging — foundational skills for operating confidently in the backcountry, regardless of your gear loadout.",
  "survival":
    "Core preparedness thinking — from everyday resilience to longer-term scenarios. Less about fear, more about building real capability.",
  preparedness:
    "Practical steps for being ready when things go sideways — power outages, job loss, natural disasters. Actionable, not alarmist.",
  "emergency preparedness":
    "Practical steps for being ready when things go sideways — power outages, job loss, natural disasters. Actionable, not alarmist.",
  prepping:
    "Practical steps for being ready when things go sideways — power outages, job loss, natural disasters. Actionable, not alarmist.",
  "ham radio and communications":
    "Staying connected when the grid isn't cooperating — Technician license prep, off-grid comms, and practical radio setups for families and neighborhoods.",
  "ham radio":
    "Staying connected when the grid isn't cooperating — Technician license prep, off-grid comms, and practical radio setups for families and neighborhoods.",
  communications:
    "Staying connected when the grid isn't cooperating — off-grid comms, mesh networks, and practical radio setups for families and neighborhoods.",
  beekeeping:
    "Keeping bees for honey, pollination, and the pure satisfaction of it — from first hive to managing a small apiary, with real keepers sharing what works.",
  "animal husbandry":
    "Livestock management for the small farm and homestead — feeding, breeding, health care, and the economics of keeping animals that pull their weight.",
  livestock:
    "Livestock management for the small farm and homestead — feeding, breeding, health care, and the economics of keeping animals that pull their weight.",
  chickens:
    "The classic homestead starter animal. These episodes cover breeds, feed, coops, egg production, meat birds, and all the things nobody tells you before you get your first flock.",
  "peak oil and energy":
    "Energy independence at the personal and household level — solar, wind, backup power, and thinking through your real energy vulnerabilities.",
  energy:
    "Energy independence at the personal and household level — solar, wind, backup power, and thinking through your real energy vulnerabilities.",
  "solar energy":
    "Sizing and installing solar systems for homes, cabins, and off-grid setups — what the installers don't always tell you about batteries, inverters, and real-world performance.",
  "water":
    "Finding, storing, filtering, and managing water — one of the most underrated preps and one of the most critical skills for any homestead.",
  "water storage":
    "Finding, storing, filtering, and managing water — one of the most underrated preps and one of the most critical skills for any homestead.",
  foraging:
    "Identifying and using wild plants for food and medicine — guided by guests who've spent years learning what actually grows where you live.",
  herbalism:
    "Plant medicine from practitioners who use it — tinctures, teas, salves, and building a home apothecary that complements conventional care.",
  "herbs and medicinal plants":
    "Plant medicine from practitioners who use it — tinctures, teas, salves, and building a home apothecary that complements conventional care.",
  "real estate":
    "Land, location, and buying property that supports the life you're trying to build — rural land, owner financing, and avoiding the mistakes that sink people.",
  "off grid living":
    "What it actually takes to live disconnected from municipal utilities — power, water, waste, and the lifestyle tradeoffs nobody talks about honestly.",
  "off-grid":
    "What it actually takes to live disconnected from municipal utilities — power, water, waste, and the lifestyle tradeoffs nobody talks about honestly.",
  community:
    "Building the human network that makes resilience real — intentional communities, neighborhood relationships, and finding your tribe.",
  "guest interview":
    "Deep-dive conversations with farmers, entrepreneurs, doctors, veterans, and experts from every corner of the self-reliance world.",
  philosophy:
    "The 'why' behind TSP — personal freedom, responsibility, thinking for yourself, and building a life that doesn't depend on any single system.",
  "the tsp back forty":
    "Jack's personal homestead — behind-the-scenes updates on what's growing, what's failing, and what he's learning in real time on his own land.",
  "back forty":
    "Jack's personal homestead — behind-the-scenes updates on what's growing, what's failing, and what he's learning in real time on his own land.",
  woodworking:
    "Building and fixing things with your own hands — tool selection, joinery, shop setup, and projects that add real value to a homestead.",
  knives:
    "Blade selection, sharpening, and the tools that earn their keep every day — practical coverage with no collector snobbery.",
  "edible landscaping":
    "Replacing ornamental plants with ones that actually feed you — fruit trees, berry bushes, and designing a yard that looks good and produces food.",
  composting:
    "Turning waste into soil fertility — hot composting, vermicomposting, bokashi, and integrating compost into a closed-loop growing system.",
  "soil science":
    "The foundation everything else is built on — soil biology, amendments, cover crops, and how to turn degraded ground into something that grows.",
  fermentation:
    "Kombucha, sourdough, kimchi, kvass, and the bigger picture of how fermentation feeds, preserves, and heals — practical episodes with real fermenters.",
  cooking:
    "Whole-food cooking from scratch — cast iron, open fire, wood stove, and getting the most out of the food you've grown or stored.",
  "primitive skills":
    "Bow-drill fire, flint-knapping, hide tanning, and other ancestral skills that sharpen your understanding of how humans lived — and what we're still capable of.",
  "wood heat":
    "Heating with wood the right way — stove selection, firewood processing, chimney safety, and the real economics of getting off fossil fuels for heat.",
  "home security":
    "Hardening your home against the threats that are actually likely — physical security, layers of defense, and thinking like a professional.",
  "bug out":
    "What it actually means to leave when you have to — planning routes, packing smart, and the decision-making framework for when staying isn't an option.",
  "bug out bag":
    "What goes in the bag, why, and what gets left out — practical load-outs built around real scenarios rather than gear-magazine fantasies.",
};

/**
 * Returns the description for a given category, or null if none is defined.
 * Matching is case-insensitive.
 */
export function getCategoryDescription(category: string): string | null {
  return descriptions[category.toLowerCase()] ?? null;
}
