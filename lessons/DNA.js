function dnaStrand(dna){
  let res ='';
  let object = {
  'A' : 'T',
  'C' : 'G',
  'T' : 'A',
  'G' : 'C'
}

  for (let i=0; i<dna.length; i++){
    res = res + object[dna[i]]
  }
  
  
  
  
  return res
}

console.log(dnaStrand("AAAA"))


//console.log(object.C)