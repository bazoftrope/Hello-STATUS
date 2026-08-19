function reloadSheeps(arr){
  
  function countSheep(arr) {
    return arr
      .filter(s => 
              s.length == 5 
              && s.includes('s') 
              && s.includes('h') 
              && s.includes('e') 
              && s.includes('p'))
      .length;
  }
  return Array.from({length: countSheep(arr)}, () => 'sheep');
};
console.log (reloadSheeps(['shepp', 'Shpee', 'pEhEs', 'PPh', 'heep', 'phees']))