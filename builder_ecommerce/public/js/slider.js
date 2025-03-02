document.addEventListener("DOMContentLoaded", function () {
  const sliderContainer = document.querySelector("#slider_container");
  const sliders = Array.from(document.querySelectorAll(".slider_item"));

  if (!sliders.length) return;

  let currentIndex = 1; // Start at the first real slide
  let interval;
  let startX = 0;
  let isDragging = false;
  const sliderWidth = sliders[0].offsetWidth + 10;

  // Clone first and last slides
  const firstClone = sliders[0].cloneNode(true);
  const lastClone = sliders[sliders.length - 1].cloneNode(true);

  // Append clones to container
  sliderContainer.appendChild(firstClone);
  sliderContainer.insertBefore(lastClone, sliders[0]);

  // Update the list of slides
  const allSlides = document.querySelectorAll(".slider_item");
  const totalSlides = allSlides.length;

  // Adjust the container position to start from the first real slide
  sliderContainer.style.transform = `translateX(-${currentIndex * sliderWidth}px)`;

  function updateActiveSlide(index, animated = true) {
    if (animated) {
      sliderContainer.style.transition = "transform 1s ease-in-out";
    } else {
      sliderContainer.style.transition = "none";
    }

    sliderContainer.style.transform = `translateX(-${index * sliderWidth}px)`;
    currentIndex = index;
  }

  function startAutoSlide() {
    interval = setInterval(() => {
      currentIndex++;
      updateActiveSlide(currentIndex);

      // Smooth transition reset when reaching the last clone
      setTimeout(() => {
        if (currentIndex === totalSlides - 1) {
          currentIndex = 1;
          updateActiveSlide(currentIndex, false);
        }
      }, 1000);
    }, 6000);
  }

  function stopAutoSlide() {
    clearInterval(interval);
  }

  updateActiveSlide(currentIndex, false);
  startAutoSlide();

  // Handle transition reset for infinite effect
  sliderContainer.addEventListener("transitionend", () => {
    if (currentIndex === totalSlides - 1) {
      currentIndex = 1;
      updateActiveSlide(currentIndex, false);
    } else if (currentIndex === 0) {
      currentIndex = totalSlides - 2;
      updateActiveSlide(currentIndex, false);
    }
  });

  // Touch events for swipe functionality
  sliderContainer.addEventListener("touchstart", (e) => {
    stopAutoSlide();
    startX = e.touches[0].clientX;
    isDragging = true;
  });

  sliderContainer.addEventListener("touchmove", (e) => {
    if (!isDragging) return;
    const diff = e.touches[0].clientX - startX;
    sliderContainer.style.transition = "none";
    sliderContainer.style.transform = `translateX(${-currentIndex * sliderWidth + diff}px)`;
  });

  sliderContainer.addEventListener("touchend", (e) => {
    isDragging = false;
    const endX = e.changedTouches[0].clientX;
    const diff = endX - startX;

    if (diff > 50) {
      // Swipe right
      currentIndex--;
    } else if (diff < -50) {
      // Swipe left
      currentIndex++;
    }
    updateActiveSlide(currentIndex);
    startAutoSlide();
  });
});
