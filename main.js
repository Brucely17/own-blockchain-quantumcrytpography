class RandomInitializer {
    constructor(valuesArray) {
      // Shuffle the valuesArray to ensure randomness
      this.shuffledArray = this.shuffleArray(valuesArray);
      this.currentIndex = 0;
    }
  
    getNextRandomValue() {
      if (this.currentIndex >= this.shuffledArray.length) {
        // If we've used all the values, reshuffle the array
        this.shuffledArray = this.shuffleArray(this.shuffledArray);
        this.currentIndex = 0;
      }
      return this.shuffledArray[this.currentIndex++];
    }

    // Shuffle the input array
    shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }
  }
  
  const values = [1, 2, 3, 4, 5]; // Replace with your values array
  const randomInitializer = new RandomInitializer(values);
  
  // Use getNextRandomValue to get a random value
  console.log(randomInitializer.getNextRandomValue());
  console.log(randomInitializer.getNextRandomValue());
  console.log(randomInitializer.getNextRandomValue());
  console.log(randomInitializer.getNextRandomValue());
  console.log(randomInitializer.getNextRandomValue());
//   console.log(randomInitializer.getNextRandomValue());
   