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
    // console.log(changedValue);
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
    <div class="container-header">
      <div class="option-title">{objectKeyToLabel(option)}</div>
    </div>
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
    width: 450px;
    max-height: 90%;
    margin-bottom: auto;
    padding-bottom: 35px;
  }
  .information-option-container.widen {
    width: 100%;
  }
  .container-header {
    display: flex;
    justify-content: space-between;
    padding: 8px 10px;
    background-color: #eee;
    border-radius: 4px 4px 0 0;
    position: relative;
  }
  .option-title {
    font-family: cms-semibold;
    font-size: 14px;
    line-height: 25px;
    color: var(--cms-text);
  }
  .properties-list {
    display: flex;
    flex-direction: column;
    max-height: 95%;
    overflow-y: scroll;
  }
  .property {
    width: 350px;
    padding: 0 25px;
    scroll-snap-align: center;
    margin: 0 auto;
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
      max-height: 75%;
    }
    .property {
      width: 100%;
    }
  }
</style>
