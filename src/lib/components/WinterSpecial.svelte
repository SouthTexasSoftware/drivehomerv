<script lang="ts">
  import winterSpecialPhoto from "$lib/photos/drivehomervwinterspecial.webp";
</script>

<img src={winterSpecialPhoto} alt="Winter Special" />

<style>
  img {
    position: absolute;
    top: 0px;
    left: 120px;
    /* width: 20vw; */
    max-height: 95px;
  }
  @media (max-width: 700px) {
    img {
      max-height: 70px;
      max-width: 50vw;
      left: 28vw;
    }
  }
</style>
