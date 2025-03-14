<script lang="ts">
</script>

<div class="card-container">
  <div class="first-image grey flex-col">
    <h2 class="font-bold text-xl">No Units Available!</h2>
    <p class="font-semibold text-center mt-2">Please choose different dates</p>
    <p class="text-sm font-base">
      Or <a href="">contact us</a> for urgent requests
    </p>
  </div>

  <p class="unit-name grey"></p>
  <div class="features-row">
    <div class="feature-item">
      <p class="feature-label grey" />
    </div>
    <div class="feature-item">
      <p class="feature-label grey" />
    </div>
  </div>
  <div class="unit-price-row">
    <p class="feature-label grey" />
  </div>
</div>

<style>
  .card-container {
    background-color: hsl(var(--b1));
    border-radius: 4px;
    box-shadow: 0 3px 5px #80808087;
    padding: 25px;
    display: flex;
    flex-direction: column;
    margin: 25px;
    width: 350px;
    height: 320px;
  }

  .first-image {
    width: 100%;
    border-radius: 4px;
    height: 175px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .no-photos-tag {
    font-family: "font-medium";
    color: hsl(var(--b3));
  }
  .unit-name {
    font-family: "font-medium";
    color: hsl(var(--p));
    font-size: 18px;
    width: 150px;
    height: 20px;
    margin-top: 7px;
    border-radius: 4px;
  }

  .features-row {
    display: flex;
    width: 100%;
    justify-content: space-between;
    margin: 10px 0;
  }
  .feature-item {
    display: flex;
    align-items: center;
    width: 50%;
    justify-content: flex-start;
  }
  .feature-label {
    margin-left: 0px;
    height: 20px;
    width: 90px;
    border-radius: 4px;
  }
  .unit-price-row {
    display: flex;
  }
  .price {
    font-family: "font-medium";
  }
  .grey {
    background: #f6f7f8;
  }
  .shine {
    background: #f6f7f8;
    background-image: linear-gradient(
      to right,
      #f6f7f8 0%,
      #edeef1 20%,
      #f6f7f8 40%,
      #f6f7f8 100%
    );
    background-repeat: no-repeat;
    background-size: 800px 200px;
    display: inline-block;
    position: relative;
    animation-duration: 1.5s;
    animation-fill-mode: forwards;
    animation-iteration-count: infinite;
    animation-name: placeholderShimmer;
    animation-timing-function: linear;

    -webkit-animation-duration: 1s;
    -webkit-animation-fill-mode: forwards;
    -webkit-animation-iteration-count: infinite;
    -webkit-animation-name: placeholderShimmer;
    -webkit-animation-timing-function: linear;
  }

  @keyframes placeholderShimmer {
    0% {
      background-position: -468px 0;
    }

    100% {
      background-position: 468px 0;
    }
  }

  @-webkit-keyframes placeholderShimmer {
    0% {
      background-position: -468px 0;
    }

    100% {
      background-position: 468px 0;
    }
  }

  @media (max-width: 70px) {
    .card-container {
      width: 90vw;
    }
    .first-image {
      height: 55vw;
    }
  }
</style>
