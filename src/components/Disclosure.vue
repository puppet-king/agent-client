<template>
  <div
    class="bg-dark-2 shadow-sm relative flex flex-col p-4 rounded-lg w-full border border-dark-3"
  >
    <Disclosure v-slot="{ open }">
      <DisclosureButton class="flex items-center justify-between">
        <slot name="title" />
        <ButtonWrapper>
          <ChevronUp
            :class="open ? 'rotate-180 transform' : ''"
            class="h-5 w-5 text-primary"
          />
        </ButtonWrapper>
      </DisclosureButton>
      <DisclosurePanel class="">
        <slot name="content" />
      </DisclosurePanel>
    </Disclosure>
  </div>
</template>

<script setup>
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/vue"
import { ChevronUp } from "lucide-vue-next"
import ButtonWrapper from "@/components/ButtonWrapper.vue"

defineOptions({
  name: "UIDisclosure",
})
</script>
