<script lang="ts">
  import type { Customer, Unit } from "$lib/types";
  import { bookingStore, firebaseStore } from "$lib/stores";
  import { getMonthString, getDayString } from "$lib/helpers";
  import ArrowIcon from "./zIconArrow.svelte";
  import { enhance } from "$app/forms";
  import { createEventDispatcher, onMount } from "svelte";
  import {
    DocumentReference,
    Timestamp,
    collection,
    doc,
    getDoc,
    setDoc,
  } from "firebase/firestore";
  import { DateTime } from "@easepick/bundle";
  import { navigating, page } from "$app/stores";
  import { fly, slide } from "svelte/transition";
  import ZIconCheckout from "./zIconCheckout.svelte";

  export let unitObject: Unit;
  let submittingForm = false;

  let photoUrl: string | undefined = undefined;
  let formCompleted = {
    firstName: false,
    lastName: false,
    email: false,
    phone: false,
    terms: false,
  };
  let buttonActive = false;
  let formObject: { [key: string]: any };
  let rvAnimationTrigger = false;

  let dispatch = createEventDispatcher();

  unitObject.photos?.forEach((photoObj) => {
    if (photoObj.index == 1) {
      photoUrl = photoObj.downloadURL;

      $bookingStore.unit_img_link = photoUrl;

      return;
    }
  });

  onMount(() => {
    setAnimationTimer();
  });

  function inputFilled(name: string) {
    switch (name) {
      case "first-name":
        formCompleted.firstName = true;
        break;
      case "last-name":
        formCompleted.lastName = true;
        break;
      case "email":
        formCompleted.email = true;
        break;
      case "phone":
        formCompleted.phone = true;
        break;
      case "terms":
        formCompleted.terms = true;
        break;
    }

    let falseFlag = false;
    Object.keys(formCompleted).forEach((key: string) => {
      //@ts-ignore
      if (!formCompleted[key]) {
        falseFlag = true;
      }
    });

    if (!falseFlag) {
      buttonActive = true;
    }
  }

  function newUUID(): string {
    // Alphanumeric characters
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let autoId = "";
    for (let i = 0; i < 20; i++) {
      autoId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return autoId;
  }

  async function createCustomer() {
    let customerId = $bookingStore.customer;

    let newCustomer = {
      id: customerId,
      first_name: formObject.firstName,
      last_name: formObject.lastName,
      email: formObject.email,
      phone: formObject.phone,
      terms_at_checkout: formObject.terms == "on" ? true : false,
      bookings: [$bookingStore.id],
      contact_form_completed: true,
      stripe_id: "",
      created: Timestamp.now(),
    } as Customer;

    let createStripeCustomer = await fetch("/api/stripe/createCustomer", {
      method: "POST",
      body: JSON.stringify(newCustomer),
      headers: {
        "Content-Type": "application/json",
      },
    });

    let serverResponse = await createStripeCustomer.json();

    if (serverResponse.error) {
      console.error(serverResponse.code);
      // return "error";
    }

    newCustomer.stripe_id = serverResponse.stripe_id;

    bookingStore.update((storeData) => {
      storeData.customerObject = newCustomer;
      return storeData;
    });

    let newCustomerDocRef = doc($firebaseStore.db, "customers", newCustomer.id);

    await setDoc(newCustomerDocRef, newCustomer);
  }

  async function updateCustomer() {
    let customerId = $bookingStore.customer;

    let updatedCustomer = {
      id: customerId,
      first_name: formObject.firstName,
      last_name: formObject.lastName,
      email: formObject.email,
      phone: formObject.phone,
      terms_at_checkout: formObject.terms == "on" ? true : false,
      contact_form_completed: true,
      stripe_id: $bookingStore.customerObject?.stripe_id,
      bookings: [$bookingStore.id],
      updated: Timestamp.now(),
    };

    let updateStripeCustomer = await fetch("/api/stripe/updateCustomer", {
      method: "POST",
      body: JSON.stringify(updatedCustomer),
      headers: {
        "Content-Type": "application/json",
      },
    });

    let serverResponse = await updateStripeCustomer.json();

    if (serverResponse.error) {
      console.error(serverResponse.code);
      // return "error";
    }

    // LOGGING For Agreement signed
    let newDate = new DateTime(formObject.date, "YYYY-MM-DD");
    let formattedDate = newDate.format("MMM-DD-YYYY");
    if (updatedCustomer.terms_at_checkout) {
      $bookingStore.agreement_details = {
        name:
          $bookingStore.customerObject!.first_name +
          " " +
          $bookingStore.customerObject!.first_name,
        date: new DateTime(new Date()).format("MMM-DD-YYYY"),
        accepted: true,
        version: 3,
      };
    }

    bookingStore.update((storeData) => {
      //@ts-ignore
      storeData.customerObject = updatedCustomer;
      return storeData;
    });

    //@ts-ignore
    let newCustomerDocRef = doc(
      $firebaseStore.db,
      "customers",
      updatedCustomer.id
    );

    await setDoc(newCustomerDocRef, updatedCustomer);
  }

  function setAnimationTimer() {
    rvAnimationTrigger = true;
    setInterval(() => {
      rvAnimationTrigger = false;
    }, 10000);
  }
</script>

<div class="review-container">
  <div class="booking-dates">
    <p class="booking-date">
      {getDayString($bookingStore.start)}, {getMonthString($bookingStore.start)}
    </p>
    {#if rvAnimationTrigger}
      <svg
        class="booking-dates-icon"
        width="32"
        height="23"
        viewBox="0 0 26 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        in:fly|local={{ x: -100, duration: 2000, delay: 500 }}
        out:fly|local={{ x: 100, duration: 2000 }}
        on:outroend={() => (rvAnimationTrigger = true)}
      >
        <path
          d="M6.19028 3.34668H2.08871C1.98761 3.34668 1.89065 3.38684 1.81917 3.45833C1.74768 3.52981 1.70752 3.62677 1.70752 3.72787V6.54103C1.70752 6.64213 1.74768 6.73908 1.81917 6.81057C1.89065 6.88206 1.98761 6.92222 2.08871 6.92222H6.19028C6.29138 6.92222 6.38834 6.88206 6.45983 6.81057C6.53131 6.73908 6.57147 6.64213 6.57147 6.54103V3.72787C6.57147 3.62677 6.53131 3.52981 6.45983 3.45833C6.38834 3.38684 6.29138 3.34668 6.19028 3.34668ZM5.8091 6.15984H2.46989V4.10905H5.8091V6.15984Z"
          fill="black"
        />
        <path
          d="M11.9032 3.34668H7.8016C7.7005 3.34668 7.60354 3.38684 7.53206 3.45833C7.46057 3.52981 7.42041 3.62677 7.42041 3.72787V6.54103C7.42041 6.64213 7.46057 6.73908 7.53206 6.81057C7.60354 6.88206 7.7005 6.92222 7.8016 6.92222H11.9032C12.0043 6.92222 12.1012 6.88206 12.1727 6.81057C12.2442 6.73908 12.2844 6.64213 12.2844 6.54103V3.72787C12.2844 3.62677 12.2442 3.52981 12.1727 3.45833C12.1012 3.38684 12.0043 3.34668 11.9032 3.34668ZM11.522 6.15984H8.18279V4.10905H11.522V6.15984Z"
          fill="black"
        />
        <path
          d="M24.3958 7.08485H23.8494L22.5279 4.74436H22.871C23.0762 4.76324 23.2828 4.73113 23.4726 4.65088C23.6623 4.57063 23.8293 4.44474 23.9587 4.28439C24.0589 4.12233 24.1223 3.9402 24.1442 3.75091C24.1662 3.56162 24.1462 3.36982 24.0857 3.18911C24.0857 3.15862 23.1937 0.154861 21.2903 0.154861H0.436852C0.335754 0.154861 0.238798 0.195022 0.167311 0.266508C0.0958248 0.337995 0.0556641 0.434952 0.0556641 0.536049C0.0556641 0.637146 0.0958248 0.734103 0.167311 0.805589C0.238798 0.877076 0.335754 0.917236 0.436852 0.917236H1.16619V1.42549H0.436852C0.335754 1.42549 0.238798 1.46565 0.167311 1.53713C0.0958248 1.60862 0.0556641 1.70558 0.0556641 1.80667V11.1076C0.0556641 11.2087 0.0958248 11.3057 0.167311 11.3772C0.238798 11.4487 0.335754 11.4888 0.436852 11.4888H2.40378C2.45604 11.9717 2.68484 12.4181 3.04625 12.7425C3.40765 13.0669 3.87617 13.2464 4.36181 13.2464C4.84745 13.2464 5.31597 13.0669 5.67738 12.7425C6.03878 12.4181 6.26759 11.9717 6.31985 11.4888H19.3742C19.4265 11.9717 19.6553 12.4181 20.0167 12.7425C20.3781 13.0669 20.8466 13.2464 21.3323 13.2464C21.8179 13.2464 22.2864 13.0669 22.6478 12.7425C23.0092 12.4181 23.2381 11.9717 23.2903 11.4888H24.9752C25.0763 11.4888 25.1732 11.4487 25.2447 11.3772C25.3162 11.3057 25.3563 11.2087 25.3563 11.1076V8.04036C25.3567 7.91436 25.332 7.78954 25.2838 7.67312C25.2356 7.55671 25.1648 7.45101 25.0754 7.36215C24.9861 7.27329 24.88 7.20303 24.7634 7.15543C24.6467 7.10783 24.5218 7.08384 24.3958 7.08485ZM22.5305 11.2779C22.5305 11.5167 22.4597 11.75 22.327 11.9485C22.1944 12.147 22.0059 12.3018 21.7853 12.3931C21.5648 12.4845 21.322 12.5084 21.0879 12.4618C20.8537 12.4152 20.6387 12.3003 20.4698 12.1315C20.301 11.9626 20.1861 11.7476 20.1395 11.5134C20.0929 11.2793 20.1168 11.0365 20.2082 10.816C20.2995 10.5954 20.4543 10.4069 20.6528 10.2743C20.8513 10.1416 21.0846 10.0708 21.3234 10.0708C21.4825 10.0702 21.6401 10.1009 21.7873 10.1612C21.9344 10.2215 22.0683 10.3103 22.1811 10.4224C22.2939 10.5345 22.3836 10.6678 22.4448 10.8146C22.5061 10.9614 22.5378 11.1188 22.5381 11.2779H22.5305ZM21.6537 4.74436L22.9727 7.08485H19.7427L19.5394 4.74436H21.6537ZM24.594 8.04798V10.7214H23.2192C23.0999 10.3129 22.8515 9.9541 22.511 9.69882C22.1706 9.44353 21.7565 9.30554 21.331 9.30554C20.9055 9.30554 20.4914 9.44353 20.151 9.69882C19.8106 9.9541 19.5621 10.3129 19.4429 10.7214H18.4086V4.74436H18.7745L19.0134 7.50162C19.0211 7.59666 19.0643 7.68531 19.1345 7.74985C19.2047 7.8144 19.2967 7.85008 19.392 7.84977H24.3958C24.4213 7.84909 24.4468 7.8535 24.4706 7.86275C24.4945 7.87199 24.5163 7.88588 24.5347 7.90362C24.5532 7.92135 24.5679 7.94257 24.5781 7.96604C24.5882 7.98952 24.5936 8.01478 24.594 8.04036V8.04798ZM4.96282 1.44073V0.932484H7.2347V1.44073H4.96282ZM7.99707 0.932484H10.2689V1.44073H7.99707V0.932484ZM11.0313 0.932484H12.0021L11.3083 1.44073H11.0313V0.932484ZM1.92857 0.932484H4.20044V1.44073H1.92857V0.932484ZM5.57018 11.2779C5.57018 11.5167 5.49938 11.75 5.36674 11.9485C5.23411 12.147 5.04559 12.3018 4.82502 12.3931C4.60445 12.4845 4.36174 12.5084 4.12759 12.4618C3.89344 12.4152 3.67835 12.3003 3.50954 12.1315C3.34072 11.9626 3.22576 11.7476 3.17918 11.5134C3.13261 11.2793 3.15651 11.0365 3.24787 10.816C3.33924 10.5954 3.49395 10.4069 3.69246 10.2743C3.89096 10.1416 4.12434 10.0708 4.36308 10.0708C4.68302 10.0715 4.98966 10.1989 5.21589 10.4251C5.44211 10.6513 5.56951 10.958 5.57018 11.2779ZM7.97928 10.5333V9.16359H9.34902V10.5333H7.97928ZM13.9131 10.7214V4.11413H16.218V10.7214H13.9131ZM17.6462 4.36825V10.7214H16.9804V3.74311C16.9804 3.64201 16.9402 3.54505 16.8687 3.47357C16.7973 3.40208 16.7003 3.36192 16.5992 3.36192H13.5319C13.4308 3.36192 13.3339 3.40208 13.2624 3.47357C13.1909 3.54505 13.1507 3.64201 13.1507 3.74311V10.7214H10.1012V8.77224C10.1012 8.67114 10.0611 8.57419 9.98958 8.5027C9.91809 8.43121 9.82113 8.39105 9.72004 8.39105H7.59809C7.497 8.39105 7.40004 8.43121 7.32855 8.5027C7.25707 8.57419 7.21691 8.67114 7.21691 8.77224V10.7112H6.25123C6.13201 10.3027 5.88354 9.94393 5.54309 9.68865C5.20265 9.43337 4.78861 9.29537 4.36308 9.29537C3.93756 9.29537 3.52351 9.43337 3.18307 9.68865C2.84263 9.94393 2.59416 10.3027 2.47493 10.7112H0.818039V2.18278H11.4354C11.5155 2.183 11.5937 2.15811 11.659 2.11162L13.3057 0.917236H21.2954C22.3119 0.917236 23.1175 2.58938 23.3564 3.41528C23.4043 3.5552 23.3961 3.70822 23.3335 3.84221C23.2471 3.96419 23.0032 3.98198 22.8685 3.98198H18.0401C17.989 3.98028 17.938 3.98888 17.8903 4.00727C17.8426 4.02566 17.7991 4.05347 17.7623 4.08904C17.7255 4.1246 17.6963 4.16721 17.6764 4.2143C17.6564 4.2614 17.6462 4.31203 17.6462 4.36317V4.36825Z"
          fill="black"
        />
        <path
          d="M21.7123 2.53349C21.7123 2.43239 21.6721 2.33543 21.6006 2.26394C21.5291 2.19246 21.4322 2.1523 21.3311 2.1523H17.9029C17.8018 2.1523 17.7049 2.19246 17.6334 2.26394C17.5619 2.33543 17.5217 2.43239 17.5217 2.53349C17.5217 2.63458 17.5619 2.73154 17.6334 2.80303C17.7049 2.87451 17.8018 2.91467 17.9029 2.91467H21.3311C21.4322 2.91467 21.5291 2.87451 21.6006 2.80303C21.6721 2.73154 21.7123 2.63458 21.7123 2.53349Z"
          fill="black"
        />
      </svg>
    {/if}
    <p class="booking-date">
      {getDayString($bookingStore.end)}, {getMonthString($bookingStore.end)}
    </p>
  </div>
  <div class="container-row">
    <div class="unit-overview">
      <p class="unit-name">{unitObject.name}</p>
      <div class="preview-image" style="background-image:url('{photoUrl}')" />

      <div class="features-row">
        <div class="feature-item">
          <svg
            width="18px"
            height="16px"
            viewBox="0 0 18 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1.21545 10.4296H17.3351V9.77107C17.3351 9.61172 17.304 9.46365 17.249 9.3311C17.1898 9.19008 17.1024 9.06458 16.9938 8.95599C16.9275 8.88972 16.8528 8.82908 16.7724 8.77549C16.6906 8.7205 16.6032 8.67255 16.5115 8.63166C16.2647 8.57807 16.0194 8.5273 15.7754 8.47936C15.53 8.43141 15.2833 8.38629 15.0351 8.34398C15.0238 8.34257 15.0153 8.34116 15.0041 8.33834C14.8785 8.31719 14.7587 8.29745 14.6445 8.27911C14.5302 8.26078 14.409 8.24245 14.282 8.22271H14.2792C13.4162 8.11272 12.556 8.02811 11.6972 7.9717C10.837 7.91529 9.98104 7.88709 9.13071 7.88568C8.62587 7.88568 8.12244 7.89414 7.61901 7.91388C7.1184 7.93362 6.61497 7.96183 6.11155 8.00131H6.10873C5.63773 8.04503 5.16815 8.10002 4.69715 8.16348C4.22756 8.22694 3.75657 8.30168 3.28275 8.38488L3.23058 8.39757C3.22071 8.40039 3.21084 8.4018 3.20237 8.4018C3.19391 8.40321 3.18545 8.40321 3.17699 8.40321C2.9556 8.44269 2.72856 8.48641 2.49447 8.53294C2.26743 8.57807 2.0404 8.62602 1.81477 8.67537C1.75837 8.70639 1.70478 8.74165 1.65401 8.77831C1.60325 8.81639 1.55389 8.85728 1.51018 8.901C1.41569 8.99548 1.34096 9.10406 1.29019 9.22534C1.24224 9.33956 1.21545 9.46647 1.21545 9.60467V10.4296ZM2.6228 0.93074H15.7359C15.9066 0.93074 16.0701 0.964584 16.2196 1.02663C16.3747 1.0915 16.5143 1.18598 16.6314 1.30161C16.7484 1.41866 16.8429 1.55826 16.9064 1.71338C16.9684 1.86286 17.0023 2.02644 17.0023 2.19707V8.21707C17.0742 8.25937 17.1447 8.30591 17.2095 8.35667C17.2829 8.41308 17.352 8.47231 17.4154 8.53577C17.579 8.69934 17.7116 8.88972 17.8004 9.10406C17.885 9.30572 17.9316 9.52993 17.9316 9.77248V10.6313C17.9358 10.6454 17.94 10.6595 17.9428 10.6736V10.6764C17.9457 10.6947 17.9471 10.7117 17.9471 10.7286C17.9471 10.7469 17.9457 10.7652 17.9414 10.7836C17.9386 10.7977 17.9344 10.8118 17.9301 10.8259V14.7264C17.9301 14.8082 17.8963 14.8829 17.8427 14.9365C17.7891 14.9901 17.7144 15.0239 17.6326 15.0239H17.0192C16.9501 15.0239 16.8866 15 16.8359 14.9605C16.7851 14.921 16.747 14.8646 16.7315 14.7997C16.6187 14.4754 16.5045 14.2187 16.3818 14.0185C16.2605 13.8211 16.1308 13.68 15.9813 13.5799C15.8304 13.4798 15.6499 13.4163 15.4313 13.3783C15.2085 13.3388 14.9491 13.3261 14.6402 13.3275L3.39275 13.3416H3.38711C3.16571 13.3374 2.9838 13.3656 2.8315 13.4248C2.68061 13.484 2.55793 13.5729 2.4564 13.6871C2.34217 13.814 2.24628 13.9762 2.15885 14.1651C2.07001 14.3583 1.98963 14.5783 1.90925 14.8195C1.88951 14.8815 1.85003 14.9309 1.80067 14.9661C1.75413 15 1.69773 15.0197 1.63991 15.0225C1.63568 15.0239 1.63145 15.0239 1.62722 15.0239H0.917906C0.836117 15.0239 0.761378 14.9901 0.707792 14.9365C0.654205 14.8829 0.620361 14.8082 0.620361 14.7264V9.60608C0.620361 9.38468 0.662666 9.18162 0.738815 8.9983C0.820605 8.8037 0.940469 8.63025 1.08995 8.48077C1.13225 8.43846 1.17879 8.39616 1.22814 8.35667C1.27045 8.32283 1.31275 8.2904 1.35788 8.26078V2.18438C1.35788 2.01375 1.39172 1.85158 1.45377 1.70492C1.51864 1.55121 1.61312 1.41302 1.73016 1.29738C1.84721 1.18175 1.98681 1.09009 2.14052 1.02663C2.29 0.964584 2.45217 0.93074 2.6228 0.93074ZM15.7359 1.52583H2.6228C2.53114 1.52583 2.44371 1.54416 2.36333 1.5766C2.28013 1.61044 2.2068 1.6598 2.14475 1.72043C2.08411 1.77966 2.03476 1.85299 2.00091 1.93196C1.96989 2.00952 1.95297 2.09413 1.95297 2.18438V7.97452C1.99527 7.96042 2.03758 7.94914 2.08129 7.93785C2.15039 7.91952 2.21949 7.90401 2.28859 7.89273C2.38448 7.87581 2.48883 7.85748 2.60164 7.83773C2.68625 7.82363 2.7765 7.80812 2.86958 7.79402V6.31616C2.86958 6.09336 2.9147 5.88042 2.99508 5.68582C3.07969 5.48276 3.20237 5.30084 3.35467 5.14855C3.50697 4.99625 3.68888 4.87356 3.89195 4.78895C4.08655 4.70857 4.29948 4.66345 4.52229 4.66345H7.31724C7.54004 4.66345 7.75298 4.70857 7.94758 4.78895C8.15065 4.87356 8.33256 4.99625 8.48485 5.14855C8.63715 5.30084 8.75984 5.48276 8.84445 5.68582C8.92483 5.88042 8.96995 6.09336 8.96995 6.31616V7.25956C9.06866 7.25815 9.16737 7.25815 9.2675 7.25815V6.31616C9.2675 6.09336 9.31262 5.88042 9.393 5.68582C9.47761 5.48276 9.6003 5.30084 9.75259 5.14855C9.90489 4.99625 10.0868 4.87356 10.2899 4.78895C10.4845 4.70857 10.6974 4.66345 10.9202 4.66345H13.7152C13.938 4.66345 14.1509 4.70857 14.3455 4.78895C14.5486 4.87356 14.7305 4.99625 14.8828 5.14855C15.0351 5.30084 15.1578 5.48276 15.2424 5.68582C15.3227 5.88042 15.3679 6.09336 15.3679 6.31616V7.77428C15.4736 7.78979 15.5864 7.80812 15.7077 7.82786C15.8417 7.84901 15.97 7.87017 16.0941 7.89132C16.1576 7.9026 16.2224 7.91529 16.2873 7.9308C16.3282 7.94067 16.3677 7.95055 16.4058 7.96183V2.19707C16.4058 2.10682 16.3874 2.0208 16.355 1.94183C16.3211 1.86004 16.2704 1.78671 16.2083 1.72325C16.1463 1.66121 16.0715 1.61044 15.9912 1.5766C15.9122 1.54416 15.8262 1.52583 15.7359 1.52583ZM6.71369 7.35546C6.99713 7.3343 7.28198 7.31597 7.57107 7.30187C7.83759 7.28777 8.10693 7.2779 8.37627 7.27085V6.31616C8.37627 6.17374 8.34807 6.03695 8.29589 5.91286C8.24231 5.78312 8.16334 5.66749 8.06463 5.56878C7.96732 5.47147 7.85028 5.39251 7.72054 5.33751C7.59645 5.28533 7.45966 5.25713 7.31724 5.25713H4.52229C4.37986 5.25713 4.24308 5.28533 4.11898 5.33751C3.98925 5.3911 3.87361 5.47006 3.7749 5.56878C3.6776 5.66608 3.59863 5.78312 3.54363 5.91286C3.49146 6.03695 3.46326 6.17374 3.46326 6.31616V7.69954C3.6917 7.66569 3.92297 7.63467 4.15988 7.60365C4.41512 7.57121 4.66895 7.5416 4.91996 7.51339C5.01726 7.50211 5.12161 7.48942 5.23019 7.47814C5.33172 7.46686 5.43749 7.45699 5.5503 7.44571C5.74208 7.42737 5.93246 7.41045 6.12001 7.39494C6.3132 7.38225 6.51062 7.36815 6.71369 7.35546ZM9.86259 7.26239C10.0332 7.26521 10.2038 7.26944 10.3745 7.27508C10.5634 7.28072 10.7524 7.28918 10.94 7.29764H10.9414C11.2502 7.30892 11.552 7.32302 11.8453 7.33994C12.1386 7.35687 12.4249 7.37802 12.6984 7.40199C13.0961 7.43725 13.4811 7.47955 13.8463 7.52891C14.1735 7.57403 14.4837 7.6248 14.7742 7.6812V6.31616C14.7742 6.17374 14.746 6.03695 14.6938 5.91286C14.6402 5.78312 14.5613 5.66749 14.4625 5.56878C14.3652 5.47147 14.2482 5.39251 14.1185 5.33751C13.9944 5.28533 13.8576 5.25713 13.7152 5.25713H10.9216C10.7792 5.25713 10.6424 5.28533 10.5183 5.33751C10.3886 5.3911 10.2729 5.47006 10.1742 5.56878C10.0769 5.66608 9.99796 5.78312 9.94297 5.91286C9.89079 6.03695 9.86259 6.17374 9.86259 6.31616V7.26239ZM17.3365 11.0261H1.21545V14.4288H1.4171C1.49607 14.206 1.57786 13.9987 1.66952 13.814C1.76824 13.6166 1.87964 13.4417 2.01502 13.2908C2.17577 13.1103 2.36474 12.9707 2.59177 12.8777C2.81881 12.786 3.08392 12.7395 3.40262 12.7465L14.6402 12.7324C15.0026 12.7324 15.3129 12.7493 15.5836 12.8015C15.8586 12.8537 16.0955 12.9425 16.3085 13.0835C16.5059 13.2147 16.6751 13.3881 16.8274 13.6152C16.9726 13.8323 17.1024 14.0989 17.2265 14.4274H17.3336V11.0261H17.3365Z"
              fill="black"
            />
          </svg>
          <p class="feature-label">
            Sleeps {unitObject.information.bullet_points.summary.sleeps}
          </p>
        </div>
        <div class="feature-item">
          <svg
            width="26"
            height="14"
            viewBox="0 0 26 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6.19028 3.34668H2.08871C1.98761 3.34668 1.89065 3.38684 1.81917 3.45833C1.74768 3.52981 1.70752 3.62677 1.70752 3.72787V6.54103C1.70752 6.64213 1.74768 6.73908 1.81917 6.81057C1.89065 6.88206 1.98761 6.92222 2.08871 6.92222H6.19028C6.29138 6.92222 6.38834 6.88206 6.45983 6.81057C6.53131 6.73908 6.57147 6.64213 6.57147 6.54103V3.72787C6.57147 3.62677 6.53131 3.52981 6.45983 3.45833C6.38834 3.38684 6.29138 3.34668 6.19028 3.34668ZM5.8091 6.15984H2.46989V4.10905H5.8091V6.15984Z"
              fill="black"
            />
            <path
              d="M11.9032 3.34668H7.8016C7.7005 3.34668 7.60354 3.38684 7.53206 3.45833C7.46057 3.52981 7.42041 3.62677 7.42041 3.72787V6.54103C7.42041 6.64213 7.46057 6.73908 7.53206 6.81057C7.60354 6.88206 7.7005 6.92222 7.8016 6.92222H11.9032C12.0043 6.92222 12.1012 6.88206 12.1727 6.81057C12.2442 6.73908 12.2844 6.64213 12.2844 6.54103V3.72787C12.2844 3.62677 12.2442 3.52981 12.1727 3.45833C12.1012 3.38684 12.0043 3.34668 11.9032 3.34668ZM11.522 6.15984H8.18279V4.10905H11.522V6.15984Z"
              fill="black"
            />
            <path
              d="M24.3958 7.08485H23.8494L22.5279 4.74436H22.871C23.0762 4.76324 23.2828 4.73113 23.4726 4.65088C23.6623 4.57063 23.8293 4.44474 23.9587 4.28439C24.0589 4.12233 24.1223 3.9402 24.1442 3.75091C24.1662 3.56162 24.1462 3.36982 24.0857 3.18911C24.0857 3.15862 23.1937 0.154861 21.2903 0.154861H0.436852C0.335754 0.154861 0.238798 0.195022 0.167311 0.266508C0.0958248 0.337995 0.0556641 0.434952 0.0556641 0.536049C0.0556641 0.637146 0.0958248 0.734103 0.167311 0.805589C0.238798 0.877076 0.335754 0.917236 0.436852 0.917236H1.16619V1.42549H0.436852C0.335754 1.42549 0.238798 1.46565 0.167311 1.53713C0.0958248 1.60862 0.0556641 1.70558 0.0556641 1.80667V11.1076C0.0556641 11.2087 0.0958248 11.3057 0.167311 11.3772C0.238798 11.4487 0.335754 11.4888 0.436852 11.4888H2.40378C2.45604 11.9717 2.68484 12.4181 3.04625 12.7425C3.40765 13.0669 3.87617 13.2464 4.36181 13.2464C4.84745 13.2464 5.31597 13.0669 5.67738 12.7425C6.03878 12.4181 6.26759 11.9717 6.31985 11.4888H19.3742C19.4265 11.9717 19.6553 12.4181 20.0167 12.7425C20.3781 13.0669 20.8466 13.2464 21.3323 13.2464C21.8179 13.2464 22.2864 13.0669 22.6478 12.7425C23.0092 12.4181 23.2381 11.9717 23.2903 11.4888H24.9752C25.0763 11.4888 25.1732 11.4487 25.2447 11.3772C25.3162 11.3057 25.3563 11.2087 25.3563 11.1076V8.04036C25.3567 7.91436 25.332 7.78954 25.2838 7.67312C25.2356 7.55671 25.1648 7.45101 25.0754 7.36215C24.9861 7.27329 24.88 7.20303 24.7634 7.15543C24.6467 7.10783 24.5218 7.08384 24.3958 7.08485ZM22.5305 11.2779C22.5305 11.5167 22.4597 11.75 22.327 11.9485C22.1944 12.147 22.0059 12.3018 21.7853 12.3931C21.5648 12.4845 21.322 12.5084 21.0879 12.4618C20.8537 12.4152 20.6387 12.3003 20.4698 12.1315C20.301 11.9626 20.1861 11.7476 20.1395 11.5134C20.0929 11.2793 20.1168 11.0365 20.2082 10.816C20.2995 10.5954 20.4543 10.4069 20.6528 10.2743C20.8513 10.1416 21.0846 10.0708 21.3234 10.0708C21.4825 10.0702 21.6401 10.1009 21.7873 10.1612C21.9344 10.2215 22.0683 10.3103 22.1811 10.4224C22.2939 10.5345 22.3836 10.6678 22.4448 10.8146C22.5061 10.9614 22.5378 11.1188 22.5381 11.2779H22.5305ZM21.6537 4.74436L22.9727 7.08485H19.7427L19.5394 4.74436H21.6537ZM24.594 8.04798V10.7214H23.2192C23.0999 10.3129 22.8515 9.9541 22.511 9.69882C22.1706 9.44353 21.7565 9.30554 21.331 9.30554C20.9055 9.30554 20.4914 9.44353 20.151 9.69882C19.8106 9.9541 19.5621 10.3129 19.4429 10.7214H18.4086V4.74436H18.7745L19.0134 7.50162C19.0211 7.59666 19.0643 7.68531 19.1345 7.74985C19.2047 7.8144 19.2967 7.85008 19.392 7.84977H24.3958C24.4213 7.84909 24.4468 7.8535 24.4706 7.86275C24.4945 7.87199 24.5163 7.88588 24.5347 7.90362C24.5532 7.92135 24.5679 7.94257 24.5781 7.96604C24.5882 7.98952 24.5936 8.01478 24.594 8.04036V8.04798ZM4.96282 1.44073V0.932484H7.2347V1.44073H4.96282ZM7.99707 0.932484H10.2689V1.44073H7.99707V0.932484ZM11.0313 0.932484H12.0021L11.3083 1.44073H11.0313V0.932484ZM1.92857 0.932484H4.20044V1.44073H1.92857V0.932484ZM5.57018 11.2779C5.57018 11.5167 5.49938 11.75 5.36674 11.9485C5.23411 12.147 5.04559 12.3018 4.82502 12.3931C4.60445 12.4845 4.36174 12.5084 4.12759 12.4618C3.89344 12.4152 3.67835 12.3003 3.50954 12.1315C3.34072 11.9626 3.22576 11.7476 3.17918 11.5134C3.13261 11.2793 3.15651 11.0365 3.24787 10.816C3.33924 10.5954 3.49395 10.4069 3.69246 10.2743C3.89096 10.1416 4.12434 10.0708 4.36308 10.0708C4.68302 10.0715 4.98966 10.1989 5.21589 10.4251C5.44211 10.6513 5.56951 10.958 5.57018 11.2779ZM7.97928 10.5333V9.16359H9.34902V10.5333H7.97928ZM13.9131 10.7214V4.11413H16.218V10.7214H13.9131ZM17.6462 4.36825V10.7214H16.9804V3.74311C16.9804 3.64201 16.9402 3.54505 16.8687 3.47357C16.7973 3.40208 16.7003 3.36192 16.5992 3.36192H13.5319C13.4308 3.36192 13.3339 3.40208 13.2624 3.47357C13.1909 3.54505 13.1507 3.64201 13.1507 3.74311V10.7214H10.1012V8.77224C10.1012 8.67114 10.0611 8.57419 9.98958 8.5027C9.91809 8.43121 9.82113 8.39105 9.72004 8.39105H7.59809C7.497 8.39105 7.40004 8.43121 7.32855 8.5027C7.25707 8.57419 7.21691 8.67114 7.21691 8.77224V10.7112H6.25123C6.13201 10.3027 5.88354 9.94393 5.54309 9.68865C5.20265 9.43337 4.78861 9.29537 4.36308 9.29537C3.93756 9.29537 3.52351 9.43337 3.18307 9.68865C2.84263 9.94393 2.59416 10.3027 2.47493 10.7112H0.818039V2.18278H11.4354C11.5155 2.183 11.5937 2.15811 11.659 2.11162L13.3057 0.917236H21.2954C22.3119 0.917236 23.1175 2.58938 23.3564 3.41528C23.4043 3.5552 23.3961 3.70822 23.3335 3.84221C23.2471 3.96419 23.0032 3.98198 22.8685 3.98198H18.0401C17.989 3.98028 17.938 3.98888 17.8903 4.00727C17.8426 4.02566 17.7991 4.05347 17.7623 4.08904C17.7255 4.1246 17.6963 4.16721 17.6764 4.2143C17.6564 4.2614 17.6462 4.31203 17.6462 4.36317V4.36825Z"
              fill="black"
            />
            <path
              d="M21.7123 2.53349C21.7123 2.43239 21.6721 2.33543 21.6006 2.26394C21.5291 2.19246 21.4322 2.1523 21.3311 2.1523H17.9029C17.8018 2.1523 17.7049 2.19246 17.6334 2.26394C17.5619 2.33543 17.5217 2.43239 17.5217 2.53349C17.5217 2.63458 17.5619 2.73154 17.6334 2.80303C17.7049 2.87451 17.8018 2.91467 17.9029 2.91467H21.3311C21.4322 2.91467 21.5291 2.87451 21.6006 2.80303C21.6721 2.73154 21.7123 2.63458 21.7123 2.53349Z"
              fill="black"
            />
          </svg>
          <p class="feature-label">
            {unitObject.information.bullet_points.summary.vehicle_type}
          </p>
        </div>
      </div>

      <div class="pickup-row">
        <p>Pickup: <span class="bold">{$bookingStore.pickup_time}</span></p>
        <p>Dropoff: <span class="bold">{$bookingStore.dropoff_time}</span></p>
      </div>
      <div class="unit-price-row">
        <p class="price">
          ${unitObject.information.rates_and_fees.pricing.base_rental_fee}&nbsp;
        </p>
        <p>per night</p>
      </div>
    </div>

    <div class="pricing-overview">
      <div class="row fee nightly-rate">
        <p>
          ${unitObject.information.rates_and_fees.pricing.base_rental_fee} x {$bookingStore.trip_length}
          Nights
        </p>
        <p>
          ${$bookingStore.nightly_rate_sum}
        </p>
      </div>

      <div class="row fee">
        <p>Service Fee</p>
        <p>${unitObject.information.rates_and_fees.pricing.service_fee}</p>
      </div>
      <div class="row fee">
        <p>Damage Protection & Roadside Assistance</p>
        <p>
          {#if $bookingStore.trip_length}
            ${$bookingStore.damage_protection}
          {/if}
        </p>
      </div>
      <div class="row fee">
        <p>Sales Tax</p>
        <p>
          {#if $bookingStore.trip_length}
            ${$bookingStore.sales_tax?.toFixed(2)}
          {/if}
        </p>
      </div>
      {#if $bookingStore.additional_line_items}
        {#each Object.keys($bookingStore.additional_line_items) as item_name}
          <div class="row fee">
            <p>{item_name}</p>
            <p>
              {#if $bookingStore.additional_line_items[item_name].type == "subtract"}
                -
              {/if}
              ${$bookingStore.additional_line_items[item_name].value}
            </p>
          </div>
        {/each}
      {/if}
      {#if $bookingStore.total_price != 1895}
        <div class="row fee mi-per-night">
          <p>100 mi per night ($0.00/night)</p>
          <p class="green-highlight">FREE</p>
        </div>
        <div class="banner">
          <div class="row fee miles-included">
            <p>Miles included</p>
            {#if $bookingStore.trip_length}
              <p>{100 * $bookingStore.trip_length} mi</p>
            {/if}
          </div>
          <p class="row fee small-note">
            Additional miles: ${unitObject.information.rates_and_fees.pricing
              .mileage_overage}/mi
          </p>
        </div>
        <div class="bar" />
        <div class="row total">
          <p>Total</p>

          <p>${$bookingStore.total_price?.toFixed(2)}</p>
        </div>
      {:else}
        <div class="banner winter">
          <div class="row fee miles-included">
            <p>Miles included</p>
            <p>Unlimited</p>
          </div>
        </div>
        <div class="bar" />
        <div class="row total">
          <p class="winter-special">Total</p>

          <p class="winter-special price">${$bookingStore.total_price}</p>
          <p class="strikethrough">${$bookingStore.original_price}</p>
        </div>
      {/if}
    </div>
  </div>

  <div class="divider wide" />

  <div class="container-row col">
    <div class="contact-info-header">Contact Information</div>

    <form
      method="POST"
      name="contact-form"
      id="contact-form"
      use:enhance={async ({ form, data, cancel }) => {
        if (submittingForm) return;
        submittingForm = true;
        rvAnimationTrigger = false;

        formObject = {};

        for (const [key, value] of data) {
          //@ts-ignore
          formObject[key] = value;
        }

        if ($bookingStore.customerObject?.id) {
          // UPDATE STRIPE AND DB INSTEAD OF CREATING NEW
          await updateCustomer();

          submittingForm = false;
          dispatch("complete", true);
          cancel();
          return;
        }

        await createCustomer();

        submittingForm = false;

        dispatch("complete", true);

        cancel();
      }}
    >
      <div class="input-wrapper">
        <p class="label">Driver's First Name</p>
        <input
          type="text"
          required
          autocomplete="given-name"
          name="firstName"
          on:change={() => inputFilled("first-name")}
          value={$bookingStore.customerObject?.first_name || ""}
        />
      </div>
      <div class="input-wrapper">
        <p class="label">Driver's Last Name</p>
        <input
          type="text"
          required
          autocomplete="family-name"
          name="lastName"
          on:change={() => inputFilled("last-name")}
          value={$bookingStore.customerObject?.last_name || ""}
        />
      </div>
      <div class="input-wrapper">
        <p class="label">Email</p>
        <input
          type="email"
          required
          autocomplete="email"
          name="email"
          on:change={() => inputFilled("email")}
          value={$bookingStore.customerObject?.email || ""}
        />
      </div>

      <div class="input-wrapper">
        <p class="label">Phone</p>
        <input
          type="tel"
          required
          autocomplete="tel"
          name="phone"
          on:change={() => inputFilled("phone")}
          value={$bookingStore.customerObject?.phone || ""}
        />
      </div>
      <div class="flex w-full items-center space-x-2 mt-4 mb-10 sm:mb-0">
        <input
          type="checkbox"
          bind:checked={$bookingStore.agreement_signed}
          class="checkbox"
          style="width:1.5rem; height: 1.5rem;"
          name="terms"
          required
          on:change={() => inputFilled("terms")}
        />
        <p>
          I have reviewed the <a
            class="font-semibold underline decoration-[#ae2623]"
            href={`/unit/${unitObject.id}/agreement/${$bookingStore.id}`}
            >Terms and Conditions</a
          >.
        </p>
      </div>
    </form>
    <button type="submit" class="right-arrow space-x-1" form="contact-form">
      {#if submittingForm}
        <div class="spinner" />
      {:else}
        <ZIconCheckout
          active={buttonActive ||
            $bookingStore.customerObject?.contact_form_completed}
        />
        <ArrowIcon
          active={buttonActive ||
            $bookingStore.customerObject?.contact_form_completed}
        />
      {/if}
    </button>
  </div>
</div>

<style>
  .review-container {
    display: flex;
    flex-direction: column;
  }
  .container-row {
    display: flex;
    justify-content: space-around;
    margin-bottom: 20px;
  }
  .booking-dates {
    display: flex;
    width: 100%;
    justify-content: center;
    align-items: center;
    margin-top: -30px;
    margin-bottom: 15px;
  }
  .booking-date {
    font-family: font-regular;
    font-size: 20px;
    color: var(--text);
  }
  .booking-dates-icon {
    margin: 0 15px;
  }
  .right-arrow {
    position: absolute;
    right: 15px;
    bottom: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .container-row.col {
    flex-direction: column;
    padding: 0 25px;
  }
  .contact-info-header {
    font-family: font-medium;
    font-size: 22px;
  }
  form {
    display: grid;
    grid-template-columns: repeat(2, auto);
    grid-template-rows: repeat(2, auto);
  }
  input {
    border-radius: 5px;
    border: 1px solid hsl(var(--b3));
    padding: 3px 10px;
    margin-top: 0;
  }
  .label {
    font-family: font-light;
    margin-bottom: 0;
    padding-bottom: 0;
  }
  .contact-methods {
    display: flex;
    height: 33px;
    align-items: center;
  }
  .contact-methods p {
    font-family: font-light;
  }
  .method {
    display: flex;
    width: 20%;
    justify-content: space-around;
    margin-right: 20px;
  }
  .divider {
    margin-top: 0;
  }
  .preview-image {
    width: 100%;
    border-radius: 10px;
    min-height: 170px;
    background-size: cover;
    background-repeat: no-repeat;
    display: flex;
    justify-content: center;
    align-items: center;
    /* background-color: hsl(var(--b2)); */
    background-position: center;
  }
  .unit-name {
    font-family: "font-medium";
    color: hsl(var(--p));
    font-size: 20px;
  }
  .features-row {
    display: flex;
    width: 100%;
    justify-content: space-between;
    margin-bottom: 5px;
    margin-top: 10px;
  }
  .feature-item {
    display: flex;
    align-items: center;

    justify-content: flex-start;
  }
  .feature-label {
    margin-left: 5px;
    font-size: 16px;
  }
  .unit-price-row {
    display: flex;
    align-self: flex-start;
    margin-top: 5px;
  }
  .price {
    font-family: "font-medium";
  }
  .unit-overview {
    width: 35%;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
  }
  .pickup-row {
    width: 100%;
    display: flex;
    justify-content: space-between;
    /* margin-top: 5px; */
  }
  .pickup-row p {
    font-size: 16px;
  }
  .bold {
    font-family: font-bold;
    color: hsl(var(--p));
  }
  .pricing-overview {
    width: 50%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
  }
  .row {
    display: flex;
    justify-content: space-between;
    margin: 5px 0px;
    z-index: 1;
    /* left/right margin for the rows is set in .col */
  }
  .row.fee {
    color: hsl(var(--n));
    opacity: 0.8;
    font-size: 16px;
    width: 100%;
  }
  .green-highlight {
    color: hsl(var(--suc));
    font-family: font-light;
  }
  .banner {
    border-radius: 10px;
    background-color: hsl(var(--b2));
    padding: 4px 10px;
    margin-bottom: 10px;
    color: hsl(var(--b3));
    width: 100%;
  }
  .banner.winter {
    background-color: #d3e3f7;
  }

  .winter-special {
    color: #3c618b;
  }
  .winter-special.price {
    margin-left: auto;
    margin-right: 10px;
  }
  .strikethrough {
    text-decoration: line-through;
    font-family: font-light !important;
  }
  .row.miles-included {
    font-size: 17px;
  }
  .row.fee.small-note {
    font-size: 13px;
    margin-top: -7px;
    margin-left: 5px;
    font-family: font-light;
  }

  .bar {
    content: "";
    width: 100%;
    height: 1px;
    background-color: hsl(var(--b2));
  }
  .row.total {
    color: hsl(var(--pf));
    font-size: 18px;

    margin-top: 10px;
    width: 100%;
  }
  .row.total p {
    font-family: font-medium;
  }

  .spinner {
    content: "";
    border-radius: 50%;
    border-top: 2px solid #3d3d3d;
    border-right: 2px solid transparent;
    animation-name: spinning;
    animation-duration: 1s;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
    opacity: 1;
    transition: all 0.2s;
    width: 25px;
    height: 25px;
    margin-right: 5px;
    margin-bottom: 5px;
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
    .booking-dates {
      margin-top: 0;
      flex-direction: column;
    }
    .booking-dates * {
      margin-bottom: 5px;
    }
    .booking-date {
      font-size: 18px;
    }
    .container-row {
      flex-direction: column;
    }
    .unit-overview,
    .pricing-overview {
      width: 100%;
      max-width: 300px;
      margin: 0 auto;
      margin-bottom: 25px;
    }
    .pricing-overview {
      margin-bottom: 0;
    }
    .unit-name {
      font-size: 26px;
    }
    .preview-image {
      width: 100%;
      min-height: 200px;
      margin: 5px auto;
      /* border-radius: 30px; doesn't work because image is embedded into bg of div */
    }
    .features-row,
    .pickup-row {
      justify-content: center;
    }
    .feature-item:nth-child(1),
    .pickup-row p:nth-child(1) {
      margin-right: 15px;
    }
    .feature-item {
      justify-content: center;
    }
    .unit-price-row {
      align-self: center;
    }
    .row.total {
      font-size: 20px;
    }
    .container-row.col {
      padding: 0;
    }
    form {
      grid-template-columns: repeat(1, auto);
      grid-template-rows: repeat(4, auto);
      padding: 0 20px;
    }
    input {
      width: 100%;
      height: 45px;
      font-size: 18px;
    }
    .contact-methods {
      margin-bottom: 35px;
    }
    .method {
      width: 30%;
      margin-right: 10%;
    }
    .method input {
      height: 20px;
      width: 20px;
      margin-left: 10px;
    }
  }

  @media (min-width: 700px) and (max-width: 1200px) {
  }

  @media (min-width: 1200px) and (max-width: 1800px) {
  }
  @media (min-width: 1800px) {
  }
</style>
