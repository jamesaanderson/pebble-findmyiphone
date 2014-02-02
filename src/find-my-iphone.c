#include <pebble.h>
#include "libs/pebble-assist.h"

#define MAX_DEVICES 5

typedef struct {
  int index;
  char id[128];
  char name[128];
} FMIDevice;

enum {
  FMI_INDEX,
  FMI_ID,
  FMI_NAME,
};

static FMIDevice devices[MAX_DEVICES];

static int num_devices;

static Window *window;
static MenuLayer *menu_layer;

static void in_received_handler(DictionaryIterator *iter, void *context) {
  Tuple *index_tuple = dict_find(iter, FMI_INDEX);
  Tuple *id_tuple = dict_find(iter, FMI_ID);
  Tuple *name_tuple = dict_find(iter, FMI_NAME);

  if (index_tuple && id_tuple && name_tuple) {
    FMIDevice device;
    device.index = index_tuple->value->int16;
    strncpy(device.id, id_tuple->value->cstring, sizeof(device.id));
    strncpy(device.name, name_tuple->value->cstring, sizeof(device.name));
    devices[device.index] = device;
    num_devices++;
    menu_layer_reload_data_and_mark_dirty(menu_layer);
  }
}

static void in_dropped_handler(AppMessageResult reason, void *context) {
}

static void out_sent_handler(DictionaryIterator *sent, void *context) {
}

static void out_failed_handler(DictionaryIterator *failed, AppMessageResult reason, void *context) {
}

static uint16_t menu_get_num_sections_callback(struct MenuLayer *menu_layer, void *callback_context) {
  return 1;
}

static uint16_t menu_get_num_rows_callback(struct MenuLayer *menu_layer, uint16_t section_index, void *callback_context) {
  return (num_devices) ? num_devices : 1;
}

static int16_t menu_get_header_height_callback(struct MenuLayer *menu_layer, uint16_t section_index, void *callback_context) {
  return MENU_CELL_BASIC_HEADER_HEIGHT;
}

static int16_t menu_get_cell_height_callback(struct MenuLayer *menu_layer, MenuIndex *cell_index, void *callback_context) {
  return MENU_CELL_BASIC_CELL_HEIGHT;
}

static void menu_draw_header_callback(GContext *ctx, const Layer *cell_layer, uint16_t section_index, void *callback_context) {
  menu_cell_basic_header_draw(ctx, cell_layer, "Find My iPhone - Devices");
}

static void menu_draw_row_callback(GContext *ctx, const Layer *cell_layer, MenuIndex *cell_index, void *callback_context) {
  if (num_devices == 0) {
    menu_cell_basic_draw(ctx, cell_layer, "Loading Devices...", NULL, NULL);
  } else {
    menu_cell_basic_draw(ctx, cell_layer, devices[cell_index->row].name, NULL, NULL);
  }
}

static void menu_select_callback(struct MenuLayer *menu_layer, MenuIndex *cell_index, void *callback_context) {
  Tuplet id_tuplet = TupletCString(FMI_ID, devices[cell_index->row].id);

  DictionaryIterator *iter;
  app_message_outbox_begin(&iter);

  if (iter == NULL) {
    return;
  }

  dict_write_tuplet(iter, &id_tuplet);
  dict_write_end(iter);

  app_message_outbox_send();
}

static void menu_select_long_callback(struct MenuLayer *menu_layer, MenuIndex *cell_index, void *callback_context) {
}

static void appmessage_init(void) {
  const int inbound_size = 124;
  const int outbound_size = 124;
  app_message_open(inbound_size, outbound_size);

  app_message_register_inbox_received(in_received_handler);
  app_message_register_inbox_dropped(in_dropped_handler);
  app_message_register_outbox_sent(out_sent_handler);
  app_message_register_outbox_failed(out_failed_handler);
}

static void init(void) {
  appmessage_init();

  window = window_create();

  menu_layer = menu_layer_create_fullscreen(window);
  menu_layer_set_callbacks(menu_layer, NULL, (MenuLayerCallbacks) {
    .get_num_sections = menu_get_num_sections_callback,
    .get_num_rows = menu_get_num_rows_callback,
    .get_header_height = menu_get_header_height_callback,
    .get_cell_height = menu_get_cell_height_callback,
    .draw_header = menu_draw_header_callback,
    .draw_row = menu_draw_row_callback,
    .select_click = menu_select_callback,
    .select_long_click = menu_select_long_callback,
  });
  menu_layer_set_click_config_onto_window(menu_layer, window);
  menu_layer_add_to_window(menu_layer, window);

  const bool animated = true;
  window_stack_push(window, animated);
}

static void deinit(void) {
  menu_layer_destroy(menu_layer);
  window_destroy(window);
}

int main(void) {
  init();

  APP_LOG(APP_LOG_LEVEL_DEBUG, "Done initializing, pushed window: %p", window);

  app_event_loop();
  deinit();
}
