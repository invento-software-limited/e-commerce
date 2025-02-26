document.addEventListener("DOMContentLoaded", function () {
  const firstSliderItem = document.querySelector(".slider_item");
  if (firstSliderItem) {
    firstSliderItem.classList.add("active");
  }
  const sliders = document.querySelectorAll(".slider_item");
  const indicators = document.querySelectorAll("#slider_indicator > div");

  if (!sliders.length || !indicators.length) return;

  let currentIndex = 0;
  let interval;


  function updateActiveSlide(index) {
    sliders.forEach(slide => slide.classList.remove("active"));

    sliders[index].classList.add("active");

    currentIndex = index;
  }

  function startAutoSlide() {
    interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % sliders.length;
      updateActiveSlide(currentIndex);
    }, 3000);
  }

  updateActiveSlide(0);
  startAutoSlide();

  indicators.forEach((indicator, index) => {
    indicator.addEventListener("click", function () {
      clearInterval(interval);
      updateActiveSlide(index);
      startAutoSlide();
    });
  });
});
