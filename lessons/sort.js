function sortList (sortBy, list) {
  return list.sort(function (a, b) {
  return b[sortBy] - a[sortBy];
  })
}
const num = 2
const arr = [
    [3,2,3],
    [9,5,6],
    [4,12,9]
]
console.log(sortList(num, arr))