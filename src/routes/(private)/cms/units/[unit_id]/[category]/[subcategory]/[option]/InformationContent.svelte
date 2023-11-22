<script lang="ts">
  import type { Unit } from "$lib/types";
  import { newUnitModel } from "$lib/helpers";
  import { afterUpdate, beforeUpdate, onMount } from "svelte";
  import { fade } from "svelte/transition";
  import { unitStore } from "$lib/stores";
  import { page } from "$app/stores";

  export let unitObject: Unit;
  export let subcategory: any;
  export let option: string;

  let propertiesScrollContainer: HTMLElement;
  let showNavContainer = false;
  let scrollPositionLeft = 0;

  let propertyList: string[] = [];

  beforeUpdate(() => {
    if ($page.params.option) {
      if ($page.params.category == "information") {
        propertyList = Object.keys(
          //@ts-ignore
          newUnitModel.information[subcategory][option]
        );
      }
    } else {
    }
  });

  // afterUpdate(() => {
  //   if (propertiesScrollContainer) {
  //     if (option == "description" || option == "notes") {
  //       showNavContainer = false;
  //       return;
  //     }
  //     if (propertiesScrollContainer.scrollWidth > 300) {
  //       showNavContainer = true;
  //     } else {
  //       showNavContainer = false;
  //     }
  //   }
  // });

  function convertToInputType(dataType: string) {
    switch (dataType) {
      case "string":
        return "text";
        break;
      case "boolean":
        return "button";
        break;
      case "number":
        return "number";
        break;
      case "object":
        return "hidden";
        break;
    }
  }

  function getPropertyValueIfDefined(propertyName: string) {
    try {
      //@ts-ignore
      if (unitObject.information[subcategory][option][propertyName]) {
        //@ts-ignore
        return unitObject.information[subcategory][option][propertyName];
      } else {
        //@ts-ignore
        return newUnitModel.information[subcategory][option][propertyName];
      }
    } catch (e) {
      // create empty object path on the unit?
      if (!unitObject.information) {
        //@ts-ignore
        unitObject.information = {};
      }

      //@ts-ignore
      if (!unitObject.information[subcategory]) {
        //@ts-ignore
        unitObject.information[subcategory] = {};
      }

      //@ts-ignore
      if (!unitObject.information[subcategory][option]) {
        //@ts-ignore
        unitObject.information[subcategory][option] = {};
      }
      //@ts-ignore
      unitObject.information[subcategory][option][propertyName] =
        //@ts-ignore
        newUnitModel.information[subcategory][option][propertyName];

      //@ts-ignore
      return unitObject.information[subcategory][option][propertyName];
    }
  }

  function recordChange(target: HTMLInputElement | HTMLTextAreaElement) {
    // get value, parse target id, set event change flag
    // save value to unitStore?
    let changedValue = target.value;
    console.log(changedValue);
    let elementIdSplit = target.id.split("?");
    let changedOption = elementIdSplit[0];
    let changedProperty = elementIdSplit[1];

    //@ts-ignore
    unitObject.information[subcategory][changedOption][changedProperty] =
      changedValue;

    unitObject.cms_edited = true;

    unitStore.update((data) => {
      data.units.forEach((unit) => {
        if (unit.id == unitObject.id) {
          unit = unitObject;
        }
      });
      return data;
    });
    // dispatch event listener to trigger changed button popup?
  }

  function objectKeyToLabel(key: string) {
    let label = key.replaceAll("_", " ");
    label = label.replaceAll("and", "&");

    return label.replace(/(^|\s)\S/g, function (t) {
      return t.toUpperCase();
    });
  }
</script>

{#if $page.params.category == "information"}
  <div
    class="information-option-container"
    class:widen={option == "description" || option == "notes"}
  >
    <div class="properties-list" bind:this={propertiesScrollContainer}>
      {#each propertyList as property}
        <!-- TODO: Add #if check for additional_options and display accordingly -->
        <div
          class="property {convertToInputType(
            //@ts-ignore
            typeof newUnitModel.information[subcategory][option][property]
          )}"
          class:widen={option == "description" || option == "notes"}
        >
          <p class="label">{objectKeyToLabel(property)}</p>
          {#if property == "content"}
            <textarea
              class="property-input textarea"
              id={option + "?" + property}
              value={getPropertyValueIfDefined(property)}
              on:input={({ currentTarget }) => {
                recordChange(currentTarget);
              }}
              on:click={({ currentTarget }) => {
                if (currentTarget.type == "button") {
                  let newValue =
                    currentTarget.value == "false" ? "true" : "false";
                  currentTarget.value = newValue;
                  recordChange(currentTarget);
                }
              }}
            />
          {:else}
            <input
              class="property-input"
              id={option + "?" + property}
              type={convertToInputType(
                //@ts-ignore
                typeof newUnitModel.information[subcategory][option][property]
              )}
              value={getPropertyValueIfDefined(property)}
              on:input={({ currentTarget }) => {
                recordChange(currentTarget);
              }}
              on:click={({ currentTarget }) => {
                if (currentTarget.type == "button") {
                  let newValue =
                    currentTarget.value == "false" ? "true" : "false";
                  currentTarget.value = newValue;
                  recordChange(currentTarget);
                }
              }}
            />
          {/if}
        </div>
      {/each}
    </div>
    {#if showNavContainer}
      <div class="nav-container">
        {#if scrollPositionLeft > 0}
          <button
            class="left"
            transition:fade
            on:click={() => {
              propertiesScrollContainer.scrollTo({
                left: scrollPositionLeft - 300,
                behavior: "smooth",
              });
              scrollPositionLeft -= 300;
            }}
          >
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <g id="Complete">
                <g>
                  <g>
                    <polyline
                      data-name="Left"
                      fill="none"
                      id="Right-2"
                      points="16.4 7 21.5 12 16.4 17"
                      stroke="#000000"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                    />

                    <line
                      fill="none"
                      stroke="#000000"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      x1="2.5"
                      x2="19.2"
                      y1="12"
                      y2="12"
                    />
                  </g>
                </g>
              </g>
            </svg></button
          >
        {/if}
        {#if scrollPositionLeft < propertiesScrollContainer.scrollWidth - 300}
          <button
            class="right"
            transition:fade
            on:click={() => {
              propertiesScrollContainer.scrollTo({
                left: scrollPositionLeft + 300,
                behavior: "smooth",
              });
              scrollPositionLeft += 300;
            }}
          >
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <g id="Complete">
                <g>
                  <g>
                    <polyline
                      data-name="Right"
                      fill="none"
                      id="Right-2"
                      points="16.4 7 21.5 12 16.4 17"
                      stroke="#000000"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                    />

                    <line
                      fill="none"
                      stroke="#000000"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      x1="2.5"
                      x2="19.2"
                      y1="12"
                      y2="12"
                    />
                  </g>
                </g>
              </g>
            </svg></button
          >
        {/if}
      </div>
    {/if}
  </div>
{/if}

<style>
  .information-option-container {
    background-color: hsl(var(--b1));
    margin: 25px;
    position: relative;
    border-radius: 4px;
    box-shadow: 0 1px 3px var(--cms-boxShadow);
    width: 100%;
    display: flex;
    flex-direction: column;
    padding-top: 20px;
    width: 300px;
    max-height: 90%;
    margin-bottom: auto;
    padding-bottom: 35px;
  }
  .information-option-container.widen {
    width: 100%;
  }
  .information-option-container::-webkit-scrollbar {
    display: none;
  }
  .properties-list {
    display: flex;
    flex-wrap: wrap;
    flex-direction: column;
    -ms-overflow-style: none;
    scrollbar-width: none;
    scroll-snap-type: x mandatory;
    max-height: 95%;
    overflow: hidden;
  }
  .property {
    width: 300px;
    padding: 0 25px;
    scroll-snap-align: center;
  }
  .property.button {
    display: flex;
    align-items: center;
    margin-top: 16px;
    border: none;
  }
  .property.button input {
    width: 75px;
    margin-top: 0;
    border-radius: 4px;
    padding: 1px;
    margin-left: 5px;
    cursor: pointer;
  }
  .property.widen {
    width: 100%;
  }
  .label {
    font-family: cms-semibold;
    font-size: 13px;
    color: var(--cms-text);
    width: 100%;
  }
  .property-input {
    border: 1px solid var(--cms-boxShadow);
    font-size: 16px;
    font-family: cms-regular;
    padding: 6px 15px;
    border-radius: 4px;
    margin-top: -10px;
    outline: none;
    width: 100%;
  }
  .property-input.textarea {
    min-height: 420px;
  }
  .nav-container {
    width: 100%;
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
  }
  button {
    width: 20px;
  }
  button.left {
    transform: rotate(180deg);
    margin-left: 10px;
    margin-right: auto;
  }
  button.right {
    margin-left: auto;
    margin-right: 10px;
  }
  @media (max-width: 500px) {
    .information-option-container {
      width: 100%;
      max-height: 90%;
    }
    .property {
      width: 100%;
    }
  }
</style>
