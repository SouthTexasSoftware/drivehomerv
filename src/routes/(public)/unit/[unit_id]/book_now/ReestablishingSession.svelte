<script lang="ts">

  
  </script>
  
  <div class="connecting-container">
    <div class="spinner" />
    <p class="secure-message">Processing your request...</p>
  </div>
  
  <style>
    .connecting-container {
      display: flex;
      flex-direction: column;
      min-height: 400px;
    }
    .secure-message {
    align-self: center;
    font-family: font-light;
    font-size: 10px;
    margin-top: 15px;
  }
    .spinner {
    content: "";
    border-radius: 50%;
    border-top: 3px solid hsl(var(--p));
    border-right: 3px solid transparent;
    animation-name: spinning;
    animation-duration: 1.5s;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
    opacity: 1;
    transition: all 0.2s;
    width: 100px;
    height: 100px;
    margin: auto;
  }
  .spinner.small {
    width: 20px;
    height: 20px;
  }
  @keyframes spinning {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 700px) {
  
}

@media (min-width: 700px) and (max-width: 1200px) {
  
}

@media (min-width: 1200px) and (max-width: 1800px) {

}
@media (min-width: 1800px) {
 
}
  </style>
  