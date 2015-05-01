var thisIsAReallyReallyReallyLongCompletion = function thisIsAReallyReallyReallyLongCompletion() {};

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9yeWFuamFkaGF2Ly5kb3RmaWxlcy9hdG9tLnN5bWxpbmsvcGFja2FnZXMvYXV0b2NvbXBsZXRlLXBsdXMvc3BlYy9maXh0dXJlcy9zYW1wbGVsb25nLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLElBQUksdUNBQXVDLEdBQUcsbURBQVksRUFBRyxDQUFDOztBQUU5RCxJQUFJLFNBQVMsR0FBRyxxQkFBWTtBQUMxQixNQUFJLElBQUk7Ozs7Ozs7Ozs7S0FBRyxVQUFTLEtBQUssRUFBRTtBQUN6QixRQUFJLEtBQUssQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFLE9BQU8sS0FBSyxDQUFDO0FBQ3BDLFFBQUksS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLEVBQUU7UUFBRSxPQUFPO1FBQUUsSUFBSSxHQUFHLEVBQUU7UUFBRSxLQUFLLEdBQUcsRUFBRSxDQUFDO0FBQzFELFdBQU0sS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7QUFDdEIsYUFBTyxHQUFHLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUN4QixhQUFPLEdBQUcsS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztLQUM1RDtBQUNELFdBQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7R0FDckQsQ0FBQSxDQUFDOztBQUVGLFNBQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7Q0FDM0MsQ0FBQyIsImZpbGUiOiIvVXNlcnMvcnlhbmphZGhhdi8uZG90ZmlsZXMvYXRvbS5zeW1saW5rL3BhY2thZ2VzL2F1dG9jb21wbGV0ZS1wbHVzL3NwZWMvZml4dHVyZXMvc2FtcGxlbG9uZy5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciB0aGlzSXNBUmVhbGx5UmVhbGx5UmVhbGx5TG9uZ0NvbXBsZXRpb24gPSBmdW5jdGlvbiAoKSB7IH07XG5cbnZhciBxdWlja3NvcnQgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBzb3J0ID0gZnVuY3Rpb24oaXRlbXMpIHtcbiAgICBpZiAoaXRlbXMubGVuZ3RoIDw9IDEpIHJldHVybiBpdGVtcztcbiAgICB2YXIgcGl2b3QgPSBpdGVtcy5zaGlmdCgpLCBjdXJyZW50LCBsZWZ0ID0gW10sIHJpZ2h0ID0gW107XG4gICAgd2hpbGUoaXRlbXMubGVuZ3RoID4gMCkge1xuICAgICAgY3VycmVudCA9IGl0ZW1zLnNoaWZ0KCk7XG4gICAgICBjdXJyZW50IDwgcGl2b3QgPyBsZWZ0LnB1c2goY3VycmVudCkgOiByaWdodC5wdXNoKGN1cnJlbnQpO1xuICAgIH1cbiAgICByZXR1cm4gc29ydChsZWZ0KS5jb25jYXQocGl2b3QpLmNvbmNhdChzb3J0KHJpZ2h0KSk7XG4gIH07XG5cbiAgcmV0dXJuIHNvcnQoQXJyYXkuYXBwbHkodGhpcywgYXJndW1lbnRzKSk7XG59O1xuIl19