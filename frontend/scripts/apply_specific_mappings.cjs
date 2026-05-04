const fs = require('fs');
const path = require('path');
const file = path.resolve(__dirname, '../src/dataset/destinations.json');
const arr = JSON.parse(fs.readFileSync(file, 'utf8'));
const specific = {
  'gangaramaya-temple': 'Western Province',
  'viharamahadevi-park': 'Western Province',
  'kelaniya-raja-maha-vihara': 'Western Province',
  'mount-lavinia-beach': 'Western Province',
  'independence-memorial-hall': 'Western Province',
  'dehiwala-zoo': 'Western Province',
  'old-parliament-building': 'Western Province',
  'jami-ul-alfar-mosque': 'Western Province',
  'sri-lanka-planetarium': 'Western Province',
  'beddagana-wetland-park': 'Western Province',
  'attidiya-bird-sanctuary': 'Western Province',
  'diyatha-uyana-park': 'Western Province',
  'st-anthonys-shrine': 'Western Province',
  'henarathgoda_botanical_garden': 'Western Province',
  'national-basilica-of-our-lady-of-lanka': 'Western Province',
  'st-marys-church': 'Western Province',
  'water-world-kelaniya': 'Western Province',
  'guruge_nature_park': 'Western Province',
  'horagolla_national_park': 'Western Province',
  'richmond_castle': 'Western Province',
  'calido_beach': 'Southern Province',
  'kalido_public_beach': 'Southern Province',
  'thudugala_waterfall': 'Sabaragamuwa Province',
  'koneswaram_temple': 'Eastern Province',
  'nallur_kovil': 'Northern Province',
  'keerimalai_temple': 'Northern Province',
  'casuarina_beach': 'Northern Province',
  'nagadeepa_temple': 'Northern Province',
  'adams_bridge': 'Northern Province',
  'vankalai_sanctuary': 'Northern Province',
  'kandarodai': 'Northern Province',
  'nilavarai_well': 'Northern Province',
  'point_pedro_lighthouse': 'Northern Province',
  'chundikulam_national_park': 'Northern Province',
  'elephant_pass_memorial': 'Northern Province',
  'thiruketheeswaram': 'Northern Province',
  'giants_tank': 'North Central Province',
  'iranamadu_tank': 'Northern Province',
  'mullaitivu_beach_park': 'Northern Province',
  'vavuniya_archaeological_site': 'Northern Province',
  'kantharodai_museum': 'Northern Province',
  'sinharaja': 'Sabaragamuwa Province',
  'adams_peak': 'Sabaragamuwa Province',
  'Saman_devalaya': 'Sabaragamuwa Province',
  'Pinnawala': 'Sabaragamuwa Province',
  'Pinnawala_zoo': 'Sabaragamuwa Province',
  'Alagalla': 'Sabaragamuwa Province',
  'Arankele': 'Central Province',
  'old_dutch_hospital': 'Southern Province',
  'maritime_archaeology_museum': 'Southern Province',
  'martin_wickramasinghe_folk_museum': 'Southern Province',
  'dutch_reformed_church': 'Southern Province',
  'japan_peace_pagoda': 'Southern Province',
  'ariapala_mask_museum': 'Southern Province',
  'all_saints_church': 'Southern Province',
  'bentota': 'Southern Province',
  'historical_mansion_museum': 'Southern Province',
  'mihiripenna_beach': 'Southern Province',
  'jungle_beach': 'Southern Province',
  'river_safari': 'Southern Province',
  'stilt_fisherman': 'Southern Province'
};

let updated = 0;
for (const obj of arr) {
  const key = obj.id || obj.name;
  if (!obj.province && specific[key]) {
    obj.province = specific[key];
    updated++;
  }
}
fs.writeFileSync(file, JSON.stringify(arr, null, 2), 'utf8');
console.log('Applied specific mappings:', updated);
