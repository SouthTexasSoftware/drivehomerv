<script lang="ts">
    import { unitStore } from "$lib/stores";
  </script>
  
  <div class="customers-selection-container">
    <h2>Customers</h2>
    <div class="divider" />
  </div>
  
  <style>
    .customers-selection-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
      border-right: 1px solid var(--cms-boxShadow);
      width: 250px;
    }
  
    h2 {
      font-family: cms-bold;
      color: var(--cms-text);
      font-size: 24px;
      margin: 100px 20px 0px 20px;
    }
    .divider {
      margin: 0 0 20px 20px;
      width: 50px;
      height: 2px;
    }
  
    @media (max-width: 1000px) {
      .customers-selection-container {
        height: 51px;
        display: flex;
        flex-direction: row;
        border: none;
        border-left: 2px solid var(--cms-boxShadow);
        border-top: 1px solid var(--cms-boxShadow);
        width: 50vw;
        position: fixed;
        bottom: 60px;
        right: 0;
        background-color: transparent;
        overflow: scroll;
        scroll-snap-type: x mandatory;
        z-index: 10;
      }
      h2,
      .divider {
        display: none;
      }
    }
  </style>
  