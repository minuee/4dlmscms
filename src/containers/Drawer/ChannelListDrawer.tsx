import React, { lazy } from 'react';
import ScrollContainer from 'react-indiana-drag-scroll';

// import { ValueType } from '@/pages/System/Detail/Group/Detail';
import { ClickedItemType } from '@/types/IMS/system/group/index';
//import { ClickedItemType } from '@/pages/IMS/System/Detail/Group/ItemList';

import { returnBoolean } from '@/utils/commonFn';

const Input = lazy(() => import('comp/Input/InputText'));
import Toggle from '@/components/Input/ToggleSlider';

// 아이템 클릭 시 오른쪽에서 나오는 slider
type SliderType = {
  clickedItem: ClickedItemType;
  onToggle: (param: boolean) => void;
};
const Slider: React.FC<SliderType> = ({ clickedItem, onToggle }) => {
  const handleFakeClick = () => {};

  //? 다이나믹하게 만들어야 하나?
  return (
    <section
      className={`${
        clickedItem.isOpen
          ? 'table__right-slider slided'
          : 'table__right-slider'
      }`}
    >
      <div className='table__right-slider__header'>
        <h1>Group Detail</h1>
        <button onClick={() => onToggle(false)}>x</button>
      </div>

      {/* group basic info */}
      <article className=''>
        <article>
          <h1 className='uppercase text-xl font-bold my-6'>group basic info</h1>
          <div className='table__right-slider__input-wrapper'>
            <div className='table__right-slider__input--first'>
              <Input
                id='id'
                name='id'
                type='text'
                placeholder='ID'
                readonly
                label='ID'
                value={clickedItem.currentValue.id || ''}
                design='inputGroupHeader'
                onClick={handleFakeClick}
              />
            </div>
            <div>
              <Input
                id='name'
                name='name'
                type='text'
                placeholder='name'
                readonly
                label='name'
                value={clickedItem.currentValue.name || ''}
                design='inputGroupHeader'
                onClick={handleFakeClick}
              />
            </div>
          </div>

          <Input
            id='description'
            name='description'
            type='text'
            readonly
            label='description'
            value={clickedItem.currentValue.description || ''}
            design='inputGroupHeader'
            onClick={handleFakeClick}
          />

          <div className='table__right-slider__input-wrapper'>
            <div className='table__right-slider__input--first'>
              <Input
                id='default_audio_index'
                name='default_audio_index'
                type='text'
                readonly
                label='default audio index'
                value={clickedItem.currentValue.default_audio_index || ''}
                design='inputGroupHeader'
                onClick={handleFakeClick}
              />
            </div>

            <div className='table__right-slider__input--first'>
              <Input
                id='default_channel_index'
                name='default_channel_index'
                type='text'
                readonly
                label='default channel index'
                value={clickedItem.currentValue.default_channel_index || ''}
                design='inputGroupHeader'
                onClick={handleFakeClick}
              />
            </div>
            <div>
              <Input
                id='group_index'
                name='group_index'
                type='text'
                readonly
                label='group index'
                value={clickedItem.currentValue.group_index || ''}
                design='inputGroupHeader'
                onClick={handleFakeClick}
              />
            </div>
          </div>
          <div className='table__right-slider__input-wrapper'>
            <Toggle
              id='is_default_group'
              label='is default group'
              name='is_default_group'
              readonly
              checked={returnBoolean(clickedItem.currentValue.is_default_group)}
              marginRight
            />
            <Toggle
              id='is_external_group'
              label='is external group'
              name='is_external_group'
              readonly
              checked={returnBoolean(
                clickedItem.currentValue.is_external_group
              )}
              marginRight
            />

            <Toggle
              id='is_interactive'
              label='is interactive'
              name='is_interactive'
              readonly
              checked={returnBoolean(clickedItem.currentValue.is_interactive)}
            />
          </div>
          <div className='table__right-slider__input-wrapper'>
            <Toggle
              id='is_pdview'
              label='is pdview'
              name='is_pdview'
              readonly
              checked={returnBoolean(clickedItem.currentValue.is_pdview)}
              marginRight
            />
            <Toggle
              id='is_replay'
              label='is replay'
              name='is_replay'
              readonly
              checked={returnBoolean(clickedItem.currentValue.is_replay)}
              marginRight
            />
            <Toggle
              id='is_timemachine'
              label='is timemachine'
              name='is_timemachine'
              readonly
              checked={returnBoolean(clickedItem.currentValue.is_timemachine)}
            />
          </div>
          <div className='table__right-slider__input-wrapper'>
            <div className='table__right-slider__input--first'>
              <Input
                id='type'
                name='type'
                type='text'
                readonly
                label='type'
                value={clickedItem.currentValue.type || ''}
                design='inputGroupHeader'
                onClick={handleFakeClick}
              />
            </div>
            <div>
              <Input
                id='view_type'
                name='view_type'
                type='text'
                readonly
                label='view type'
                value={clickedItem.currentValue.view_type || ''}
                design='inputGroupHeader'
                onClick={handleFakeClick}
              />
            </div>
          </div>
        </article>

        {/* video info */}
        <article>
          <h1 className='uppercase text-xl font-bold my-6'>video info</h1>
          {/* <h3 className='uppercase text-lg font-bold my-4'>input info</h3> */}
          <table className='table table-report'>
            <thead>
              <tr>
                <th className='th--basic--uppercase'>TYPE</th>
                <th className='th--basic--uppercase'>CODEC</th>
                <th className='th--basic--uppercase'>WIDTH</th>
                <th className='th--basic--uppercase'>HEIGHT</th>
                <th className='th--basic--uppercase'>FPS</th>
                <th className='th--basic--uppercase'>GOP</th>
                <th className='th--basic--uppercase'>BITRATE</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>INPUT</td>
                <td>{clickedItem.currentValue.video?.input_info?.codec}</td>
                <td>{clickedItem.currentValue.video?.input_info?.width}</td>
                <td>{clickedItem.currentValue.video?.input_info?.height}</td>
                <td>{clickedItem.currentValue.video?.input_info?.fps}</td>
                <td>{clickedItem.currentValue.video?.input_info?.gop}</td>
                <td>{clickedItem.currentValue.video?.input_info?.bitrate}</td>
              </tr>
              <tr>
                <td>OUTPUT</td>
                <td>{clickedItem.currentValue.video?.output_info?.codec}</td>
                <td>{clickedItem.currentValue.video?.output_info?.width}</td>
                <td>{clickedItem.currentValue.video?.output_info?.height}</td>
                <td>{clickedItem.currentValue.video?.output_info?.fps}</td>
                <td>{clickedItem.currentValue.video?.output_info?.gop}</td>
                <td>{clickedItem.currentValue.video?.output_info?.bitrate}</td>
              </tr>
            </tbody>
          </table>
        </article>

        {/* audio info */}
        <article>
          <h1 className='uppercase text-xl font-bold my-6'>audio info</h1>
          {/* <h3 className='uppercase text-lg font-bold my-4'>input info</h3> */}
          <table className='table table-report'>
            <thead>
              <tr>
                <th className='th--basic--uppercase'>TYPE</th>
                <th className='th--basic--uppercase'>CODEC</th>
                <th className='th--basic--uppercase'>SAMPLE RATE</th>
                <th className='th--basic--uppercase'>SAMPLE BIT</th>
                <th className='th--basic--uppercase'>CHANNEL TYPE</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>INPUT</td>
                <td>{clickedItem.currentValue.audio?.input_info?.codec}</td>
                <td>
                  {clickedItem.currentValue.audio?.input_info?.sample_rate}
                </td>
                <td>
                  {clickedItem.currentValue.audio?.input_info?.sample_bit}
                </td>
                <td>
                  {clickedItem.currentValue.audio?.input_info?.channel_type}
                </td>
              </tr>
              <tr>
                <td>OUTPUT</td>
                <td>{clickedItem.currentValue.audio?.output_info?.codec}</td>
                <td>
                  {clickedItem.currentValue.audio?.output_info?.sample_rate}
                </td>
                <td>
                  {clickedItem.currentValue.audio?.output_info?.sample_bit}
                </td>
                <td>
                  {clickedItem.currentValue.audio?.output_info?.channel_type}
                </td>
              </tr>
            </tbody>
          </table>
        </article>

        {/* channel list */}
        <article>
          <h1 className='uppercase text-xl font-bold my-6'>channel list</h1>
          <ScrollContainer className='scroll-container'>
            <table className='table table-report'>
              <thead>
                <tr>
                  <th className='th--basic--uppercase'>channel ID</th>
                  <th className='th--basic--uppercase'>
                    LIVE
                    <br />
                    INDEX
                  </th>
                  <th className='th--basic--uppercase'>
                    CAMERA
                    <br />
                    IP
                  </th>
                  <th className='th--basic--uppercase'>STATUS</th>

                  <th className='th--basic--uppercase'>
                    MEDIA
                    <br />
                    TYPE
                    <br />
                    NAME
                  </th>
                  <th className='th--basic--uppercase'>
                    GIMBAL
                    <br />
                    IP
                  </th>
                  <th className='th--basic--uppercase'>
                    IS
                    <br />
                    GIMBAL
                    <br />
                    PRESET
                  </th>

                  <th className='th--basic--uppercase'>
                    PDVIEW
                    <br />
                    MASTER
                    <br />
                    INDEX
                  </th>
                </tr>
              </thead>
              <tbody>
                {clickedItem.currentValue.channel_list?.map((item) => {
                  return (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.live_index}</td>
                      <td>{item.camera_ip}</td>
                      <td>{item.status}</td>
                      <td>{item.media_type_name}</td>
                      <td>{item.gimbal_ip}</td>
                      <td>{item.is_gimbal_preset}</td>
                      <td>{item.pdview_master_index}</td>
                      {/* <td>{item.registered_at.split('T')[0]}</td>
                        <td>{item.updated_at.split('T')[0]}</td> */}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ScrollContainer>
        </article>
      </article>
    </section>
  );
};

export default Slider;
