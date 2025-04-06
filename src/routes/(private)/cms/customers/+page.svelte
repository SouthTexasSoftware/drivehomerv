<script lang="ts">
  $: server_response = "";

  async function rentalAgreementCheck() {
    let initiateJob = await fetch("/api/email/rentalAgreementCron", {
      method: "POST",
      body: JSON.stringify({}),
      headers: {
        "Content-Type": "application/json",
      },
    });
    let serverResponse = await initiateJob.json();
    if (serverResponse.error) {
      console.error(serverResponse.code);
      // return "error";
    }
    // console.log(serverResponse);
  }
</script>

<!-- 
<div class="wrapper">
  <button class="btn" on:click={rentalAgreementCheck}>
    POST TO Agreement API Endpoint</button
  >
  <p>{server_response}</p>
</div> -->

<style>
  @media (min-width: 700px) and (max-width: 1200px) {
  }

  @media (min-width: 1200px) and (max-width: 1800px) {
  }
  @media (min-width: 1800px) {
  }
</style>
