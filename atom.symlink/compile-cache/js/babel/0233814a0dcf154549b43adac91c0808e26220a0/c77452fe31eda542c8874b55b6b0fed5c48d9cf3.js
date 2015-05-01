var quicksort = function quicksort() {
  var sort = (function (_sort) {
    function sort(_x) {
      return _sort.apply(this, arguments);
    }

    sort.toString = function () {
      return _sort.toString();
    };

    return sort;
  })(function (items) {
    if (items.length <= 1) return items;
    var pivot = items.shift(),
        current,
        left = [],
        right = [];
    while (items.length > 0) {
      current = items.shift();
      current < pivot ? left.push(current) : right.push(current);
    }
    return sort(left).concat(pivot).concat(sort(right));
  });

  return sort(Array.apply(this, arguments));
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9yeWFuamFkaGF2Ly5kb3RmaWxlcy9hdG9tLnN5bWxpbmsvcGFja2FnZXMvYXV0b2NvbXBsZXRlLXBsdXMvc3BlYy9maXh0dXJlcy9zYW1wbGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBSSxTQUFTLEdBQUcscUJBQVk7QUFDMUIsTUFBSSxJQUFJOzs7Ozs7Ozs7O0tBQUcsVUFBUyxLQUFLLEVBQUU7QUFDekIsUUFBSSxLQUFLLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRSxPQUFPLEtBQUssQ0FBQztBQUNwQyxRQUFJLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxFQUFFO1FBQUUsT0FBTztRQUFFLElBQUksR0FBRyxFQUFFO1FBQUUsS0FBSyxHQUFHLEVBQUUsQ0FBQztBQUMxRCxXQUFNLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO0FBQ3RCLGFBQU8sR0FBRyxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDeEIsYUFBTyxHQUFHLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7S0FDNUQ7QUFDRCxXQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0dBQ3JELENBQUEsQ0FBQzs7QUFFRixTQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO0NBQzNDLENBQUMiLCJmaWxlIjoiL1VzZXJzL3J5YW5qYWRoYXYvLmRvdGZpbGVzL2F0b20uc3ltbGluay9wYWNrYWdlcy9hdXRvY29tcGxldGUtcGx1cy9zcGVjL2ZpeHR1cmVzL3NhbXBsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBxdWlja3NvcnQgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBzb3J0ID0gZnVuY3Rpb24oaXRlbXMpIHtcbiAgICBpZiAoaXRlbXMubGVuZ3RoIDw9IDEpIHJldHVybiBpdGVtcztcbiAgICB2YXIgcGl2b3QgPSBpdGVtcy5zaGlmdCgpLCBjdXJyZW50LCBsZWZ0ID0gW10sIHJpZ2h0ID0gW107XG4gICAgd2hpbGUoaXRlbXMubGVuZ3RoID4gMCkge1xuICAgICAgY3VycmVudCA9IGl0ZW1zLnNoaWZ0KCk7XG4gICAgICBjdXJyZW50IDwgcGl2b3QgPyBsZWZ0LnB1c2goY3VycmVudCkgOiByaWdodC5wdXNoKGN1cnJlbnQpO1xuICAgIH1cbiAgICByZXR1cm4gc29ydChsZWZ0KS5jb25jYXQocGl2b3QpLmNvbmNhdChzb3J0KHJpZ2h0KSk7XG4gIH07XG5cbiAgcmV0dXJuIHNvcnQoQXJyYXkuYXBwbHkodGhpcywgYXJndW1lbnRzKSk7XG59O1xuIl19