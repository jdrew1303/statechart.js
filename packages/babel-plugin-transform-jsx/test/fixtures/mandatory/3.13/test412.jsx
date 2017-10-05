<scxml initial="s0" version="1.0">

  <state id="s0" initial="s01">
    <onentry>
      <send event="timeout" delay="1s"/>
    </onentry>

    <transition event="timeout" target="fail"/>
    <transition event="event1" target="fail"/>
    <transition event="event2" target="pass"/>

    <state id="s01">
      <onentry>
        <raise event="event1"/>
      </onentry>
      <initial>
        <transition target="s011">
          <raise event="event2"/>
        </transition>
      </initial>

      <state id="s011">
        <onentry>
          <raise event="event3"/>
        </onentry>
        <transition target="s02"/>
      </state>
    </state>

    <state id="s02">
      <transition event="event1" target="s03"/>
      <transition event="*" target="fail"/>
    </state>

    <state id="s03">
      <transition event="event2" target="s04"/>
      <transition event="*" target="fail"/>
    </state>

    <state id="s04">
      <transition event="event3" target="pass"/>
      <transition event="*" target="fail"/>
    </state>

  </state>

  <final id="pass"></final>
  <final id="fail"></final>

</scxml>
