// Placeholder ad inventory: demonstrates where paid placements would appear. No ad network, tracking or links.
const slots=[
 {target:'#photo-mode aside',size:'300 × 250',pitch:'Reach shoppers matching furniture to their inspiration photos.'},
 {target:'#planner-mode aside',size:'300 × 250',pitch:'Put your brand in front of people planning a room by style and budget.'},
 {target:'#board-mode .rb-setup',size:'300 × 600',pitch:'Movers, storage, donation pickup and furniture brands: meet people in the middle of a move.',tall:true},
 {target:'#market-mode .mk-filters',size:'300 × 250',pitch:'Reach local buyers browsing secondhand and unique finds.'}
];
for(const s of slots){const host=document.querySelector(s.target);if(!host||host.querySelector('.ad-slot'))continue;
 host.insertAdjacentHTML('beforeend',`<aside class="ad-slot${s.tall?' ad-slot-tall':''}" aria-label="Advertisement placeholder"><span class="ad-tag">Ad</span><div class="ad-body"><strong>Advertise with us</strong><p>${s.pitch}</p><span class="ad-size">${s.size} ad space</span></div></aside>`);}
