type BinarySearchComparison < T > = (candidate: T) => -1 | 0 | 1;

const BinarySearch = {
  search: function<T> (list: T[], comparisonFn: BinarySearchComparison<T>): T | null {
    let minIndex: number = 0;
    let maxIndex: number = list.length - 1;
    let currentIndex: number | null = null;
    let currentElement: T | null = null;

    while (minIndex <= maxIndex) {
      currentIndex = (minIndex + maxIndex) / 2 | 0;
      currentElement = list[currentIndex];

      let comparisonResult = comparisonFn(currentElement);
      if (comparisonResult > 0) {
        minIndex = currentIndex + 1;
      } else if (comparisonResult < 0) {
        maxIndex = currentIndex - 1;
      } else {
        return currentElement;
      }
    }

    return null;
  }
};

export default BinarySearch;
