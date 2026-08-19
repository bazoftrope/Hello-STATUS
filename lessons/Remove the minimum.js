// Remove the minimum 
function removeSmallest(numbers) {
  if (numbers.length === 0) return numbers
  let min = numbers[0]
  let arr = []
  let onoff = false
  for (let i = 1; i < numbers.length; i++){
    if (min > numbers[i]) min = numbers[i]
  }
  for (let i = 0; i < numbers.length; i++) {
    if (onoff === true) {arr.push(numbers[i])}
    else {if (numbers[i] !== min) arr.push(numbers[i])}
    if (numbers[i] === min) onoff = true 
  }
  return arr
}

console.log (removeSmallest([9, 1, 2, 3, 4, 5, 1]))